import type SharpType from 'sharp'

/**
 * Composite a logo onto a fixed-size canvas at a chosen position + size, over
 * either a solid background colour or a full-bleed background image (e.g. a
 * generated effect). Shared by the phone-wallpaper / virtual-background /
 * story-highlight placement editors. x/y are the logo CENTRE as a 0–1 fraction
 * of the canvas; scale is the logo width as a 0–1 fraction of the canvas width.
 */
export async function composePlacement(
  opts: {
    canvasW: number
    canvasH: number
    bgColor: { r: number; g: number; b: number }
    bgImage?: Buffer | null
    logo: Buffer
    x: number
    y: number
    scale: number
  },
  sharp: typeof SharpType
): Promise<Buffer> {
  const { canvasW, canvasH, bgColor, bgImage, logo, x, y, scale } = opts

  const base = bgImage
    ? await sharp(bgImage).resize(canvasW, canvasH, { fit: 'cover', position: 'centre' }).png().toBuffer()
    : await sharp({
        create: { width: canvasW, height: canvasH, channels: 4, background: { ...bgColor, alpha: 1 } },
      })
        .png()
        .toBuffer()

  // Size the logo to `scale` of the canvas width, but never taller than the canvas.
  const meta = await sharp(logo).metadata()
  const aspect = (meta.width ?? 1) / (meta.height ?? 1)
  const s = Math.min(0.98, Math.max(0.03, scale))
  let lw = Math.max(24, Math.round(canvasW * s))
  let lh = Math.round(lw / Math.max(0.05, aspect))
  const maxH = Math.round(canvasH * 0.98)
  if (lh > maxH) {
    lh = maxH
    lw = Math.round(lh * aspect)
  }
  const sizedLogo = await sharp(logo).resize(lw, lh, { fit: 'inside' }).png().toBuffer()
  const sm = await sharp(sizedLogo).metadata()
  const fw = sm.width ?? lw
  const fh = sm.height ?? lh

  // Centre at (x,y) but keep the logo fully on-canvas (sharp composite needs
  // non-negative offsets within bounds).
  const left = Math.max(0, Math.min(canvasW - fw, Math.round(x * canvasW - fw / 2)))
  const top = Math.max(0, Math.min(canvasH - fh, Math.round(y * canvasH - fh / 2)))

  return sharp(base).composite([{ input: sizedLogo, left, top }]).png().toBuffer()
}
