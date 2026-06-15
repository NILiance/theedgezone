/**
 * Google Gemini 2.5 Flash Image client — produces brand logos and arsenal
 * assets. Verbatim port of the legacy WP plugin's nilbd_gemini_generate_image
 * (BrandDesign.php:4973) with the response uploaded to Supabase storage so
 * call-sites can stay URL-based.
 *
 * Auth: GEMINI_API_KEY env var. Falls back to a stub set when missing so
 * the studio still renders something in local dev.
 *
 * Model: gemini-2.5-flash-image — same model the legacy plugin used for
 * every image generation path (logos + every Brand Arsenal generator).
 *
 * Reference images: pass `referenceImageUrl` (Round 2+) so we attach the
 * chosen R1 image as the FIRST inlineData part. Gemini uses it as the
 * style/composition reference for the refined output.
 */
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { buildLogoPrompt, type BrandPrefs, REFINEMENT_SEEDS } from '@/lib/brand-prompts'
import { mirrorImageToDrive } from '@/lib/gdrive'

const GEMINI_MODEL = 'gemini-2.5-flash-image'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/** Public-shape result — kept compatible with the legacy Ideogram client. */
export interface GeneratedConcept {
  url: string
  thumbnail_url?: string
  prompt: string
  metadata?: Record<string, unknown>
}

const BUCKET = 'brand-assets'

interface GeminiInlineData {
  mimeType?: string
  data?: string
}
interface GeminiPart {
  inlineData?: GeminiInlineData
  text?: string
}
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
  error?: { message?: string }
}

/**
 * Single Gemini image call. Returns the public storage URL after upload.
 * Throws on failure with a sanitized message — the wrapper functions
 * forward the message so users see the actual cause (rate limit, model
 * unavailable, billing not enabled) instead of a generic 'offline'.
 */
async function callGeminiOnce(opts: {
  prompt: string
  referenceImageUrl?: string
  uploadPath: string
  /** Optional Drive mirror info — when present, the saved image is also
   * copied into the talent's Drive folder for backup/share. */
  driveMirror?: {
    userName: string
    brandSlug: string
    subfolder?: string
    filename: string
  }
}): Promise<GeneratedConcept> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('Designer not configured — admin needs to set the API key.')
  }

  // Build parts: reference image FIRST (when present), then text.
  const parts: GeminiPart[] = []
  if (opts.referenceImageUrl) {
    const refData = await fetchImageAsBase64(opts.referenceImageUrl)
    if (refData && refData.base64.length < 4_000_000) {
      parts.push({ inlineData: { mimeType: refData.mimeType, data: refData.base64 } })
    }
  }
  parts.push({ text: opts.prompt })

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  }

  let res: Response
  try {
    res = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network error'
    console.error('[gemini] fetch failed', err)
    throw new Error(`Designer unreachable: ${message}`)
  }

  if (!res.ok) {
    const text = await res.text()
    console.error('[gemini]', res.status, text.slice(0, 300))
    // Bubble the underlying API error so the admin (and Mike) can see
    // exactly what's wrong — usually quota, billing, or model gating.
    let apiMsg = ''
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } }
      apiMsg = parsed.error?.message ?? text.slice(0, 200)
    } catch {
      apiMsg = text.slice(0, 200)
    }
    throw new Error(`Designer error (HTTP ${res.status}): ${apiMsg}`)
  }
  const json = (await res.json()) as GeminiResponse
  const imagePart = json.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data
  )
  if (!imagePart?.inlineData?.data) {
    console.error('[gemini] no image in response')
    throw new Error('Designer returned no image — try a simpler prompt or retry.')
  }
  const mimeType = imagePart.inlineData.mimeType ?? 'image/png'
  const buffer = Buffer.from(imagePart.inlineData.data, 'base64')

  const url = await uploadBuffer(opts.uploadPath, buffer, mimeType)
  // uploadBuffer throws on failure with a sanitized message; success is
  // a non-empty public URL.

  // Drive mirror — non-blocking. We await it so its errors get logged in
  // the same request, but a failure here doesn't break the user-facing
  // result because we already have the Supabase URL above.
  if (opts.driveMirror) {
    try {
      await mirrorImageToDrive({
        buffer,
        filename: opts.driveMirror.filename,
        mimeType,
        userName: opts.driveMirror.userName,
        brandSlug: opts.driveMirror.brandSlug,
        subfolder: opts.driveMirror.subfolder,
      })
    } catch (err) {
      console.error('[gdrive mirror]', err instanceof Error ? err.message : err)
    }
  }

  return {
    url,
    prompt: opts.prompt,
    metadata: { provider: 'gemini', model: GEMINI_MODEL },
  }
}

async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const mimeType = res.headers.get('content-type') ?? 'image/png'
    const buf = Buffer.from(await res.arrayBuffer())
    return { base64: buf.toString('base64'), mimeType }
  } catch {
    return null
  }
}

async function uploadBuffer(
  path: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const supabase = createServiceClient()
  if (!supabase) {
    throw new Error(
      'Storage service role missing — admin needs to set SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.'
    )
  }

  // Ensure the bucket exists (idempotent). New environments often hit
  // 'Bucket not found' on first upload because the migration that creates
  // it hasn't run. Creating here keeps the studio working out of the box.
  try {
    const { data: existing } = await supabase.storage.getBucket(BUCKET)
    if (!existing) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024,
      })
      if (createErr && !createErr.message.includes('already exists')) {
        console.error('[storage] bucket create failed', createErr.message)
        throw new Error(
          `Storage bucket "${BUCKET}" missing and could not be auto-created: ${createErr.message}`
        )
      }
    }
  } catch (err) {
    // getBucket throws when the bucket doesn't exist on some Supabase
    // versions — fall through to create.
    if (err instanceof Error && err.message.includes('not found')) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024,
      })
      if (createErr) {
        throw new Error(
          `Storage bucket "${BUCKET}" missing and could not be auto-created: ${createErr.message}`
        )
      }
    } else if (err instanceof Error && err.message.startsWith('Storage bucket')) {
      throw err
    }
    // Other errors (network, etc.) — let the upload below report.
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(buffer), {
      contentType: mimeType,
      upsert: true,
    })
  if (error) {
    console.error('[storage] upload failed', error.message)
    throw new Error(`Storage upload failed: ${error.message}`)
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// ── Public surface ───────────────────────────────────────────────────────────

export interface GenerateLogosOptions {
  brandId: string
  prefs: BrandPrefs
  round: 1 | 2
  count: number
  /** Required for round 2 — the chosen R1 image. */
  referenceImageUrl?: string
  /** Optional — seeds Round 2 variations. Auto-cycled from REFINEMENT_SEEDS. */
  refinementSeeds?: string[]
  /** Optional — only used for stub fallback labelling. */
  startIndex?: number
  /** Talent's display name — used as the top-level Drive folder name. */
  userName?: string
  /** Brand slug — used as the per-brand Drive folder name. */
  brandSlug?: string
}

/**
 * Generate N logo concepts in parallel using the verbatim legacy prompts.
 * Concept index cycles the 6 style modifier groups so each result looks
 * distinct. Round 2 takes a `referenceImageUrl` and uses it on every call.
 */
export async function generateLogoConcepts(
  opts: GenerateLogosOptions
): Promise<GeneratedConcept[]> {
  if (!env.GEMINI_API_KEY) {
    return stubConcepts(opts.count, opts.prefs.name ?? 'concept', opts.startIndex ?? 0)
  }

  const startIndex = opts.startIndex ?? 0
  const calls = Array.from({ length: opts.count }, (_, i) => {
    const conceptIndex = startIndex + i
    const refinementSeed =
      opts.round === 2
        ? opts.refinementSeeds?.[i] ?? REFINEMENT_SEEDS[conceptIndex % REFINEMENT_SEEDS.length]
        : undefined
    const prompt = buildLogoPrompt({
      prefs: opts.prefs,
      round: opts.round,
      conceptIndex,
      refinementSeed,
    })
    const uploadPath = `${opts.brandId}/concepts/r${opts.round}-${Date.now()}-${conceptIndex}.png`
    const driveMirror =
      opts.userName && opts.brandSlug
        ? {
            userName: opts.userName,
            brandSlug: opts.brandSlug,
            subfolder: `concepts/round-${opts.round}`,
            filename: `r${opts.round}-${conceptIndex + 1}.png`,
          }
        : undefined
    return callGeminiOnce({
      prompt,
      referenceImageUrl: opts.referenceImageUrl,
      uploadPath,
      driveMirror,
    })
  })

  const results = await Promise.allSettled(calls)
  const concepts = results
    .filter((r): r is PromiseFulfilledResult<GeneratedConcept> => r.status === 'fulfilled')
    .map((r) => r.value)
  // If every parallel call failed, surface the FIRST failure reason so
  // the user sees the actual problem (quota, billing, model gating, etc.)
  // instead of a generic 'designer is offline' message.
  if (concepts.length === 0) {
    const firstReason = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected'
    )?.reason
    const msg =
      firstReason instanceof Error
        ? firstReason.message
        : typeof firstReason === 'string'
          ? firstReason
          : 'Designer returned nothing.'
    throw new Error(msg)
  }
  return concepts
}

/**
 * Single-image generation for Brand Arsenal generators (social templates,
 * merch mockups, business cards, etc). Same shape as the legacy
 * `nilbd_gemini_generate_image` — pass any prompt and an optional logo
 * reference. Returns the public URL or throws on failure.
 */
export async function generateArsenalImage(opts: {
  brandId: string
  prompt: string
  category: string
  /** Optional logo URL used as the reference image. */
  referenceImageUrl?: string
  /** Optional filename hint. */
  filenameHint?: string
  /** Talent's display name — used as the top-level Drive folder name. */
  userName?: string
  /** Brand slug — used as the per-brand Drive folder name. */
  brandSlug?: string
}): Promise<GeneratedConcept> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('Our designer is not configured yet — admins should set it up under Integrations.')
  }
  const slug = (opts.filenameHint ?? opts.category).replace(/[^a-zA-Z0-9_-]/g, '_')
  const uploadPath = `${opts.brandId}/arsenal/${opts.category}/${Date.now()}-${slug}.png`
  const driveMirror =
    opts.userName && opts.brandSlug
      ? {
          userName: opts.userName,
          brandSlug: opts.brandSlug,
          subfolder: `arsenal/${opts.category}`,
          filename: `${Date.now()}-${slug}.png`,
        }
      : undefined
  const result = await callGeminiOnce({
    prompt: opts.prompt,
    referenceImageUrl: opts.referenceImageUrl,
    uploadPath,
    driveMirror,
  })
  if (!result) throw new Error('Our designer returned no image. Try again, or simplify the prompt.')
  return result
}

/** Local-dev stubs when GEMINI_API_KEY is missing. */
function stubConcepts(count: number, seed: string, startIndex: number): GeneratedConcept[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = startIndex + i
    return {
      url: `https://picsum.photos/seed/${encodeURIComponent(seed)}-${idx}/512/512`,
      thumbnail_url: `https://picsum.photos/seed/${encodeURIComponent(seed)}-${idx}/256/256`,
      prompt: `stub: ${seed} #${idx}`,
      metadata: { stub: true, provider: 'gemini-stub' },
    }
  })
}
