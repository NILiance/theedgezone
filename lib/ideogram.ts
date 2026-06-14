/**
 * Ideogram V3 API client for logo / concept generation.
 *
 * Uses the V3 Generate endpoint, which produces high-quality images with
 * accurate text rendering — the right fit for athlete brand logos.
 *
 * Auth: API-Key header from IDEOGRAM_API_KEY env var. Returns a stub set
 * when the key is missing, so the studio still renders in local dev.
 */
import { env } from '@/lib/env'

export interface GeneratedConcept {
  url: string
  thumbnail_url?: string
  prompt: string
  seed?: number
  metadata?: Record<string, unknown>
}

export interface GenerateOptions {
  prompt: string
  count: number
  aspect_ratio?: '1x1' | '16x9' | '9x16' | '4x3' | '3x4'
  resolution?: string
  /** Hex colors to bias the palette toward, e.g. ['#C8A84E', '#000000']. */
  palette?: string[]
  magic_prompt?: 'AUTO' | 'ON' | 'OFF'
  negative_prompt?: string
}

const IDEOGRAM_GENERATE_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate'
const IDEOGRAM_REMIX_URL = 'https://api.ideogram.ai/v1/ideogram-v3/remix'

export async function generateConcepts(opts: GenerateOptions): Promise<GeneratedConcept[]> {
  if (!env.IDEOGRAM_API_KEY) {
    return stubConcepts(opts)
  }

  // Ideogram V3 returns one image per request. To get N concepts, we issue N
  // parallel calls with the same prompt + slight prompt variation so seeds
  // diverge naturally.
  const calls = Array.from({ length: opts.count }, (_, i) =>
    callIdeogramOnce({
      ...opts,
      prompt: i === 0 ? opts.prompt : `${opts.prompt} — variant ${i + 1}`,
    })
  )

  const results = await Promise.allSettled(calls)
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GeneratedConcept> =>
        r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value)
}

async function callIdeogramOnce(opts: GenerateOptions): Promise<GeneratedConcept | null> {
  const body: Record<string, unknown> = {
    prompt: opts.prompt,
    aspect_ratio: opts.aspect_ratio ?? '1x1',
    rendering_speed: 'QUALITY',
    magic_prompt: opts.magic_prompt ?? 'AUTO',
  }
  if (opts.resolution) body.resolution = opts.resolution
  if (opts.negative_prompt) body.negative_prompt = opts.negative_prompt
  if (opts.palette && opts.palette.length > 0) {
    body.color_palette = {
      members: opts.palette.map((hex) => ({ color_hex: hex.toUpperCase() })),
    }
  }

  try {
    const res = await fetch(IDEOGRAM_GENERATE_URL, {
      method: 'POST',
      headers: {
        'Api-Key': env.IDEOGRAM_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[ideogram]', res.status, text.slice(0, 200))
      return null
    }
    const json = (await res.json()) as {
      data?: Array<{ url: string; prompt?: string; seed?: number; resolution?: string }>
    }
    const item = json.data?.[0]
    if (!item?.url) return null
    return {
      url: item.url,
      prompt: item.prompt ?? opts.prompt,
      seed: item.seed,
      metadata: { resolution: item.resolution },
    }
  } catch (err) {
    console.error('[ideogram] fetch failed', err)
    return null
  }
}

// ── Remix (used by rounds 2 & 3) ─────────────────────────────────────────

export interface RemixOptions {
  /** Source image URL to remix. Must be publicly fetchable. */
  source_url: string
  prompt: string
  count: number
  aspect_ratio?: '1x1' | '16x9' | '9x16' | '4x3' | '3x4'
  /** 0–1; how much to deviate from the source. Higher = more change. */
  strength?: number
  palette?: string[]
}

/**
 * Remix the given source concept N times. Each call hits Ideogram V3
 * Remix with the same image + a slightly-varied prompt so seeds diverge.
 */
export async function remixConcept(opts: RemixOptions): Promise<GeneratedConcept[]> {
  if (!env.IDEOGRAM_API_KEY) {
    return stubConcepts({
      prompt: `remix:${opts.prompt}`,
      count: opts.count,
      aspect_ratio: opts.aspect_ratio,
    })
  }

  const calls = Array.from({ length: opts.count }, (_, i) =>
    callIdeogramRemixOnce({
      ...opts,
      prompt: i === 0 ? opts.prompt : `${opts.prompt} — variant ${i + 1}`,
    })
  )
  const results = await Promise.allSettled(calls)
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GeneratedConcept> =>
        r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value)
}

async function callIdeogramRemixOnce(opts: RemixOptions): Promise<GeneratedConcept | null> {
  try {
    // Pull the source image into a Blob so we can multipart it.
    const sourceRes = await fetch(opts.source_url)
    if (!sourceRes.ok) {
      console.error('[ideogram] failed to fetch source for remix', sourceRes.status)
      return null
    }
    const sourceBlob = await sourceRes.blob()

    const form = new FormData()
    form.append('image', sourceBlob, 'source.png')
    form.append('prompt', opts.prompt)
    form.append('aspect_ratio', opts.aspect_ratio ?? '1x1')
    form.append('rendering_speed', 'QUALITY')
    if (typeof opts.strength === 'number') {
      form.append('image_weight', String(Math.max(1, Math.min(100, Math.round(opts.strength * 100)))))
    }
    if (opts.palette && opts.palette.length > 0) {
      form.append(
        'color_palette',
        JSON.stringify({
          members: opts.palette.map((hex) => ({ color_hex: hex.toUpperCase() })),
        })
      )
    }

    const res = await fetch(IDEOGRAM_REMIX_URL, {
      method: 'POST',
      headers: { 'Api-Key': env.IDEOGRAM_API_KEY! },
      body: form,
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[ideogram remix]', res.status, text.slice(0, 200))
      return null
    }
    const json = (await res.json()) as {
      data?: Array<{ url: string; prompt?: string; seed?: number; resolution?: string }>
    }
    const item = json.data?.[0]
    if (!item?.url) return null
    return {
      url: item.url,
      prompt: item.prompt ?? opts.prompt,
      seed: item.seed,
      metadata: { resolution: item.resolution, source_url: opts.source_url, kind: 'remix' },
    }
  } catch (err) {
    console.error('[ideogram remix] fetch failed', err)
    return null
  }
}

/** Refinement prompt for round 2 — focuses on cleaning, simplifying. */
export function r2RefinePrompt({ name, sport }: { name: string; sport?: string | null }): string {
  const sportLine = sport ? ` for a ${sport} athlete` : ''
  return `Refine this logo${sportLine} for "${name}". Same composition. Cleaner lines, more iconic, simpler shapes. Better balance and contrast. Pure white background. Single centered mark. Vector quality.`
}

/** Refinement prompt for round 3 — focuses on polish and finalization. */
export function r3FinalizePrompt({ name }: { name: string }): string {
  return `Finalize this logo for "${name}". Production-quality. Crisp edges, perfect symmetry where appropriate, polished proportions. Pure white background, perfectly centered, single mark. Vector-ready.`
}

/**
 * Stub concepts used when IDEOGRAM_API_KEY is missing — uses public
 * placeholder URLs so the studio still renders something in local dev.
 */
function stubConcepts(opts: GenerateOptions): GeneratedConcept[] {
  return Array.from({ length: opts.count }, (_, i) => ({
    url: `https://picsum.photos/seed/${encodeURIComponent(opts.prompt)}-${i}/512/512`,
    thumbnail_url: `https://picsum.photos/seed/${encodeURIComponent(opts.prompt)}-${i}/256/256`,
    prompt: opts.prompt,
    metadata: { stub: true },
  }))
}

/**
 * Default Round 1 prompt template — mirrors the legacy
 * `prompt_r1_logo` from EdgeZoneFulfillment.
 */
export function defaultR1Prompt({
  name,
  sport,
  style,
}: {
  name: string
  sport?: string | null
  style?: string | null
}): string {
  const sportLine = sport ? ` for a ${sport} athlete` : ''
  const styleLine = style ? ` Style: ${style}.` : ''
  return `IMPORTANT: Generate exactly ONE logo centered on a pure white background. Do NOT show multiple logos or a logo sheet. Design a single professional logo${sportLine} named "${name}".${styleLine} Vector illustration. One monogram, wordmark, or icon mark. High quality, professional, centered.`
}
