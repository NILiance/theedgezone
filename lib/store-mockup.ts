/**
 * NIL Stores — POD mockup compositor.
 *
 * Composites a brand logo onto a product blank, replicating the legacy
 * `nil_store_ajax_pod_mockup` geometry (placement presets + size %). Sharp is
 * imported lazily (libvips load is finicky on Vercel; see brand-kit.ts).
 */

export type MockupPlacement = 'front_chest' | 'front_center' | 'back'

export const MOCKUP_PLACEMENTS: { id: MockupPlacement; label: string }[] = [
  { id: 'front_chest', label: 'Left chest (small)' },
  { id: 'front_center', label: 'Center (large)' },
  { id: 'back', label: 'Back (centered)' },
]

interface ComposeMockupInput {
  blankBuffer: Buffer
  logoBuffer: Buffer
  placement: MockupPlacement
  /** Logo width as a % of the blank width (10–70). */
  sizePct: number
  /** Knock out near-white pixels in the logo so it sits cleanly on colored blanks. */
  knockoutWhite?: boolean
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export async function composeMockup({
  blankBuffer,
  logoBuffer,
  placement,
  sizePct,
  knockoutWhite = true,
}: ComposeMockupInput): Promise<Buffer> {
  const { default: sharp } = await import('sharp')

  const blank = sharp(blankBuffer)
  const meta = await blank.metadata()
  const bw = meta.width ?? 1000
  const bh = meta.height ?? 1000

  // Target logo width per placement + size. `front_chest` stays small (≤18%)
  // even if the slider is cranked up — matches the legacy left-chest rule.
  let targetW = Math.round(bw * (clamp(sizePct, 10, 70) / 100))
  if (placement === 'front_chest' && sizePct > 25) targetW = Math.round(bw * 0.18)
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

  // Placement geometry — mirrors the legacy pos_map.
  let dstX = Math.round((bw - lw) / 2)
  let dstY = Math.round(bh * 0.32)
  if (placement === 'front_chest') {
    dstX = Math.round(bw * 0.32)
    dstY = Math.round(bh * 0.26)
  } else if (placement === 'back') {
    dstY = Math.round(bh * 0.3)
  }
  // Keep the logo on-canvas.
  dstX = clamp(dstX, 0, Math.max(0, bw - lw))
  dstY = clamp(dstY, 0, Math.max(0, bh - lh))

  return blank
    .composite([{ input: logoPng, left: dstX, top: dstY }])
    .png()
    .toBuffer()
}
