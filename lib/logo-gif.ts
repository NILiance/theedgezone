/**
 * Renders a brand logo into a real animated GIF (one frame per motion step),
 * so the logo-animation Download yields a playable asset instead of code and
 * the Your Creations tile shows it animating live. Pure-JS encoding (gifenc) +
 * Sharp for per-frame compositing — no native deps beyond Sharp.
 */
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import type { OverlayOptions } from 'sharp'

const SIZE = 420
const FRAMES = 24
const BG = { r: 255, g: 255, b: 255 }

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

interface Tf {
  scale: number
  opacity: number
  dx: number
  dy: number
  rotate: number
  wipe: number
  blur: number
}

// Maps each CSS-keyframe style to a per-frame transform sampled at progress p.
function transformFor(style: string, p: number): Tf {
  const e = easeOut(p)
  const t: Tf = { scale: 1, opacity: 1, dx: 0, dy: 0, rotate: 0, wipe: 1, blur: 0 }
  switch (style) {
    case 'fade':
      t.opacity = p
      break
    case 'slide_up':
      t.opacity = Math.min(1, p * 1.4)
      t.dy = (1 - e) * 90
      break
    case 'slide_down':
      t.opacity = Math.min(1, p * 1.4)
      t.dy = -(1 - e) * 90
      break
    case 'zoom':
      t.opacity = Math.min(1, p * 1.6)
      t.scale = p < 0.6 ? lerp(0.5, 1.08, e / easeOut(0.6)) : lerp(1.08, 1, (p - 0.6) / 0.4)
      break
    case 'rotate':
      t.opacity = Math.min(1, p * 1.4)
      t.rotate = -180 * (1 - e)
      t.scale = lerp(0.7, 1, e)
      break
    case 'bounce':
      t.opacity = Math.min(1, p * 2)
      t.scale =
        p < 0.5
          ? lerp(0.3, 1.15, p / 0.5)
          : p < 0.7
            ? lerp(1.15, 0.95, (p - 0.5) / 0.2)
            : lerp(0.95, 1, (p - 0.7) / 0.3)
      break
    case 'glitch': {
      t.opacity = p < 0.1 ? p * 10 : 1
      const a = p < 0.45 ? 1 - p / 0.45 : 0
      t.dx = Math.sin(p * 48) * 7 * a
      t.dy = Math.cos(p * 40) * 4 * a
      break
    }
    case 'reveal_wipe':
      t.wipe = e
      break
    case 'zoom_out':
      t.opacity = Math.min(1, p * 1.6)
      t.scale = lerp(1.8, 1, e)
      break
    case 'spin':
      t.opacity = Math.min(1, p * 1.4)
      t.rotate = 360 * (1 - e)
      t.scale = lerp(0.4, 1, e)
      break
    case 'pop':
      t.opacity = Math.min(1, p * 2.5)
      t.scale =
        p < 0.5
          ? lerp(0.2, 1.3, p / 0.5)
          : p < 0.7
            ? lerp(1.3, 0.92, (p - 0.5) / 0.2)
            : lerp(0.92, 1, (p - 0.7) / 0.3)
      break
    case 'drop':
      t.opacity = Math.min(1, p * 1.5)
      t.dy = p < 0.6 ? lerp(-140, 12, easeOut(p / 0.6)) : lerp(12, 0, (p - 0.6) / 0.4)
      break
    case 'blur_in':
      t.opacity = p
      t.blur = lerp(28, 0, e)
      break
    default:
      t.opacity = e
      t.scale = lerp(0.6, 1, e)
  }
  return t
}

export async function renderLogoGif(
  logoBuf: Buffer,
  style: string,
  opts: { durationMs?: number; loop?: boolean } = {}
): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  const dur = Math.max(600, Math.min(8000, opts.durationMs ?? 1600))
  const baseDelay = Math.max(30, Math.round(dur / FRAMES))

  const gif = GIFEncoder()
  for (let i = 0; i < FRAMES; i++) {
    const p = i / (FRAMES - 1)
    const t = transformFor(style, p)
    const fit = Math.max(8, Math.round(SIZE * 0.8 * t.scale))

    // Logo squared to `fit` so its dimensions are known for centering.
    const transparent = { r: 0, g: 0, b: 0, alpha: 0 }
    let layerBuf = await sharp(logoBuf)
      .resize(fit, fit, { fit: 'contain', background: transparent })
      .png()
      .toBuffer()
    let lw = fit
    let lh = fit
    if (t.rotate) {
      layerBuf = await sharp(layerBuf).rotate(t.rotate, { background: transparent }).png().toBuffer()
      let meta = await sharp(layerBuf).metadata()
      lw = meta.width ?? fit
      lh = meta.height ?? fit
      // A rotated square's bounding box grows (up to side×√2 at 45°) and can
      // exceed the canvas — Sharp's composite rejects an overlay larger than
      // the base, which would fail the whole GIF. Clamp it back inside.
      if (lw > SIZE || lh > SIZE) {
        layerBuf = await sharp(layerBuf)
          .resize(SIZE, SIZE, { fit: 'inside', background: transparent })
          .png()
          .toBuffer()
        meta = await sharp(layerBuf).metadata()
        lw = meta.width ?? SIZE
        lh = meta.height ?? SIZE
      }
    }

    const left = Math.round((SIZE - lw) / 2 + t.dx)
    const top = Math.round((SIZE - lh) / 2 + t.dy)
    const composites: OverlayOptions[] = [{ input: layerBuf, left, top }]

    // Wipe: paint white over the not-yet-revealed right portion.
    if (t.wipe < 1) {
      const revealed = Math.round(SIZE * t.wipe)
      const coverW = SIZE - revealed
      if (coverW > 0) {
        composites.push({
          input: { create: { width: coverW, height: SIZE, channels: 3, background: BG } },
          left: revealed,
          top: 0,
        })
      }
    }

    let pipe = sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: BG } }).composite(
      composites
    )
    if (t.blur >= 0.3) pipe = pipe.blur(t.blur)
    const rgba = await pipe.ensureAlpha().raw().toBuffer()

    // Opacity → blend toward the white background (logo fades in cleanly).
    if (t.opacity < 1) {
      const op = Math.max(0, Math.min(1, t.opacity))
      for (let j = 0; j < rgba.length; j += 4) {
        rgba[j] = Math.round(255 * (1 - op) + rgba[j] * op)
        rgba[j + 1] = Math.round(255 * (1 - op) + rgba[j + 1] * op)
        rgba[j + 2] = Math.round(255 * (1 - op) + rgba[j + 2] * op)
      }
    }

    const data = new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    const last = i === FRAMES - 1
    gif.writeFrame(index, SIZE, SIZE, {
      palette,
      delay: last ? 800 : baseDelay,
      ...(i === 0 ? { repeat: opts.loop ? 0 : -1 } : {}),
    })
  }
  gif.finish()
  return Buffer.from(gif.bytes())
}
