/**
 * NIL Stores — POD mockup compositor.
 *
 * Composites a brand logo onto a product blank, replicating the legacy
 * `nil_store_ajax_pod_mockup` geometry (placement presets + size %). Sharp is
 * imported lazily (libvips load is finicky on Vercel; see brand-kit.ts).
 */

export type MockupPlacement = 'front_chest' | 'front_center' | 'back' | 'center'

export const MOCKUP_PLACEMENTS: { id: MockupPlacement; label: string }[] = [
  { id: 'front_chest', label: 'Left chest (small)' },
  { id: 'front_center', label: 'Center (large)' },
  { id: 'back', label: 'Back (centered)' },
  { id: 'center', label: 'Dead center' },
]

interface ComposeMockupInput {
  blankBuffer: Buffer
  logoBuffer: Buffer
  placement: MockupPlacement
  /** Logo width as a % of the blank width (10–70). */
  sizePct: number
  /** Knock out near-white pixels in the logo so it sits cleanly on colored blanks. */
  knockoutWhite?: boolean
  /** Optional free placement — logo CENTRE as 0–1 fractions; overrides `placement`. */
  x?: number
  y?: number
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export async function composeMockup({
  blankBuffer,
  logoBuffer,
  placement,
  sizePct,
  knockoutWhite = true,
  x,
  y,
}: ComposeMockupInput): Promise<Buffer> {
  const { default: sharp } = await import('sharp')

  const blank = sharp(blankBuffer)
  const meta = await blank.metadata()
  const bw = meta.width ?? 1000
  const bh = meta.height ?? 1000

  // Target logo width per placement + size. `front_chest` stays small (≤18%)
  // even if the slider is cranked up — matches the legacy left-chest rule.
  const free = typeof x === 'number' && typeof y === 'number'
  let targetW = Math.round(bw * (clamp(sizePct, 5, free ? 90 : 70) / 100))
  if (!free && placement === 'front_chest' && sizePct > 25) targetW = Math.round(bw * 0.18)
  targetW = Math.max(1, Math.min(targetW, bw))

  // Resize the logo first (cheaper raster), then optionally knock out white.
  const resized = sharp(logoBuffer).ensureAlpha().resize({ width: targetW })
  let logoPng: Buffer
  if (knockoutWhite) {
    const { data, info } = await resized.raw().toBuffer({ resolveWithObject: true })
    const ch = info.channels
    for (let i = 0; i < data.length; i += ch) {
      if (data[i]! > 240 && data[i + 1]! > 240 && data[i + 2]! > 240) data[i + 3] = 0
    }
    logoPng = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: ch },
    })
      .png()
      .toBuffer()
  } else {
    logoPng = await resized.png().toBuffer()
  }

  const lMeta = await sharp(logoPng).metadata()
  const lw = lMeta.width ?? targetW
  const lh = lMeta.height ?? targetW

  // Placement geometry. Free x/y (admin per-product placement) wins; otherwise
  // fall back to the legacy named pos_map.
  let dstX: number
  let dstY: number
  if (typeof x === 'number' && typeof y === 'number') {
    dstX = Math.round(x * bw - lw / 2)
    dstY = Math.round(y * bh - lh / 2)
  } else {
    dstX = Math.round((bw - lw) / 2)
    dstY = Math.round(bh * 0.32)
    if (placement === 'front_chest') {
      dstX = Math.round(bw * 0.32)
      dstY = Math.round(bh * 0.26)
    } else if (placement === 'back') {
      dstY = Math.round(bh * 0.3)
    } else if (placement === 'center') {
      dstY = Math.round((bh - lh) / 2)
    }
  }
  // Keep the logo on-canvas.
  dstX = clamp(dstX, 0, Math.max(0, bw - lw))
  dstY = clamp(dstY, 0, Math.max(0, bh - lh))

  return blank
    .composite([{ input: logoPng, left: dstX, top: dstY }])
    .png()
    .toBuffer()
}
