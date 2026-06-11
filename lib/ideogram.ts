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
