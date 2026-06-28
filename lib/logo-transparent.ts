import type SharpType from 'sharp'

/**
 * Soft-threshold near-white pixels to alpha so a logo that was generated on a
 * white/solid background cuts cleanly onto any surface (QR codes, photos,
 * avatars). Mirrors the brand-kit's `logo-transparent.png`, so the result is
 * the same transparent logo the talent gets in their kit. Returns a PNG buffer.
 */
export async function makeLogoTransparent(
  source: Buffer,
  sharp: typeof SharpType
): Promise<Buffer> {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const out = Buffer.from(data)
  for (let i = 0; i < out.length; i += channels) {
    const r = out[i]!
    const g = out[i + 1]!
    const b = out[i + 2]!
    if (r > 240 && g > 240 && b > 240) {
      out[i + 3] = 0
    } else if (r > 220 && g > 220 && b > 220) {
      out[i + 3] = Math.round(((255 - Math.max(r, g, b)) / 35) * 255)
    }
  }
  return sharp(out, { raw: { width, height, channels } }).png().toBuffer()
}
