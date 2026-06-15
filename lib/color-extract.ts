/**
 * Dominant color extraction from a logo image.
 *
 * Downsamples to 64×64, drops near-white (Ideogram canvas) and near-black
 * pixels lighter than the threshold, buckets the remaining pixels by
 * 4-bit quantized hue + 3-bit value, then picks the top buckets weighted
 * by saturation × population. Returns up to four colors covering most
 * brand palettes.
 */
// sharp is loaded lazily inside extractPaletteFromBuffer so that this module
// can be imported by server-component pages (which would otherwise trigger
// sharp's native binding init at render time and crash the page if the
// binary is missing).

export interface ExtractedPalette {
  primary: string | null
  secondary: string | null
  accent: string | null
  neutral: string | null
}

interface RawBucket {
  count: number
  rSum: number
  gSum: number
  bSum: number
  satMax: number
}

function rgbToHsv(r: number, g: number, b: number) {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
  }
  h = (h * 60 + 360) % 360
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v }
}

function toHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function distance(a: { h: number; s: number; v: number }, b: { h: number; s: number; v: number }): number {
  const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180
  const ds = a.s - b.s
  const dv = a.v - b.v
  return Math.sqrt(dh * dh + ds * ds + dv * dv)
}

export async function extractPaletteFromUrl(url: string): Promise<ExtractedPalette> {
  const res = await fetch(url)
  if (!res.ok) {
    return { primary: null, secondary: null, accent: null, neutral: null }
  }
  const buf = Buffer.from(await res.arrayBuffer())
  return extractPaletteFromBuffer(buf)
}

export async function extractPaletteFromBuffer(buffer: Buffer): Promise<ExtractedPalette> {
  const { default: sharp } = await import('sharp')
  // 64×64 keeps the bucket math fast (4,096 samples) while still picking
  // up small accent colors.
  const { data } = await sharp(buffer)
    .resize(64, 64, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const buckets = new Map<string, RawBucket>()
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    // Drop near-white (Ideogram solid background) and near-black if it's
    // just outline thickness. Anti-aliased mid-tones still count.
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max > 245 && min > 240) continue // near-white
    const { h, s, v } = rgbToHsv(r, g, b)
    if (v < 0.06) continue // near-black
    // Quantize: 24 hue bins + 4 value bins + saturated/unsaturated.
    const hueBin = s < 0.12 ? -1 : Math.floor(h / 15)
    const valBin = Math.floor(v * 4)
    const satBin = s < 0.12 ? 0 : 1
    const key = `${hueBin}_${valBin}_${satBin}`
    const existing = buckets.get(key)
    if (existing) {
      existing.count += 1
      existing.rSum += r
      existing.gSum += g
      existing.bSum += b
      if (s > existing.satMax) existing.satMax = s
    } else {
      buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b, satMax: s })
    }
  }

  if (buckets.size === 0) {
    return { primary: null, secondary: null, accent: null, neutral: null }
  }

  type Scored = {
    hex: string
    weight: number
    h: number
    s: number
    v: number
    isGray: boolean
  }
  const scored: Scored[] = []
  for (const bucket of buckets.values()) {
    const r = bucket.rSum / bucket.count
    const g = bucket.gSum / bucket.count
    const b = bucket.bSum / bucket.count
    const { h, s, v } = rgbToHsv(r, g, b)
    // Weight more saturated colors above gray. Gray gets a quarter weight
    // so it competes for the neutral slot but rarely steals primary.
    const weight = bucket.count * (s > 0.12 ? 1 + bucket.satMax : 0.25)
    scored.push({ hex: toHex(r, g, b), weight, h, s, v, isGray: s < 0.12 })
  }
  scored.sort((a, b) => b.weight - a.weight)

  // Greedy pick — primary is the heaviest saturated color; secondary is
  // the next that's perceptually distinct from primary; accent is the
  // next perceptually distinct from both. Neutral is the heaviest gray
  // candidate (if any) for borders / muted UI.
  const picked: Scored[] = []
  const MIN_DISTANCE = 0.25
  const saturated = scored.filter((s) => !s.isGray)
  const gray = scored.find((s) => s.isGray)
  for (const cand of saturated) {
    if (picked.every((p) => distance(p, cand) > MIN_DISTANCE)) {
      picked.push(cand)
      if (picked.length >= 3) break
    }
  }

  return {
    primary: picked[0]?.hex ?? null,
    secondary: picked[1]?.hex ?? null,
    accent: picked[2]?.hex ?? null,
    neutral: gray?.hex ?? null,
  }
}
