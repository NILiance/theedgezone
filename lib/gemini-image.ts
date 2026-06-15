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
 * Single Gemini image call. Returns the public storage URL after upload,
 * or null on failure. Caller is responsible for the upload path so we
 * can namespace per-brand without leaking it here.
 */
async function callGeminiOnce(opts: {
  prompt: string
  referenceImageUrl?: string
  uploadPath: string
}): Promise<GeneratedConcept | null> {
  if (!env.GEMINI_API_KEY) return null

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

  try {
    const res = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[gemini]', res.status, text.slice(0, 300))
      return null
    }
    const json = (await res.json()) as GeminiResponse
    const imagePart = json.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    )
    if (!imagePart?.inlineData?.data) {
      console.error('[gemini] no image in response')
      return null
    }
    const mimeType = imagePart.inlineData.mimeType ?? 'image/png'
    const buffer = Buffer.from(imagePart.inlineData.data, 'base64')

    const url = await uploadBuffer(opts.uploadPath, buffer, mimeType)
    if (!url) return null

    return {
      url,
      prompt: opts.prompt,
      metadata: { provider: 'gemini', model: GEMINI_MODEL },
    }
  } catch (err) {
    console.error('[gemini] fetch failed', err)
    return null
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
): Promise<string | null> {
  const supabase = createServiceClient()
  if (!supabase) return null
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(buffer), {
      contentType: mimeType,
      upsert: true,
    })
  if (error) {
    console.error('[gemini] upload failed', error.message)
    return null
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
    return callGeminiOnce({
      prompt,
      referenceImageUrl: opts.referenceImageUrl,
      uploadPath,
    })
  })

  const results = await Promise.allSettled(calls)
  return results
    .filter((r): r is PromiseFulfilledResult<GeneratedConcept> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value)
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
}): Promise<GeneratedConcept> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('Our designer is not configured yet — admins should set it up under Integrations.')
  }
  const slug = (opts.filenameHint ?? opts.category).replace(/[^a-zA-Z0-9_-]/g, '_')
  const uploadPath = `${opts.brandId}/arsenal/${opts.category}/${Date.now()}-${slug}.png`
  const result = await callGeminiOnce({
    prompt: opts.prompt,
    referenceImageUrl: opts.referenceImageUrl,
    uploadPath,
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
