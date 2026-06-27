/**
 * Trading-card renderer using satori (pure-JS) — text is converted to vector
 * PATHS using a fetched font, so the card renders correctly on serverless where
 * librsvg has no fonts (the old SVG-text approach produced tofu boxes).
 * Renders front + back side-by-side into one PNG. Returns null if the font
 * can't be loaded, so the caller can fall back.
 */
import satori from 'satori'
import type SharpType from 'sharp'

const W = 800
const H = 1120
const FONT_URL = 'https://cdn.jsdelivr.net/gh/google/fonts/ofl/anton/Anton-Regular.ttf'

let fontCache: ArrayBuffer | null = null
async function loadFont(): Promise<ArrayBuffer | null> {
  if (fontCache) return fontCache
  try {
    const res = await fetch(FONT_URL, { signal: AbortSignal.timeout(7000) })
    if (!res.ok) return null
    fontCache = await res.arrayBuffer()
    return fontCache
  } catch {
    return null
  }
}

export interface CardPalette {
  bg: string
  border: string
  accent: string
  text: string
}

export interface CardData {
  name: string
  subline: string
  school: string
  stats: string
  tagline: string
  photoDataUrl: string
  logoDataUrl?: string
  website?: string
  handle?: string
  styleLabel: string
}

type Node = { type: string; props: Record<string, unknown> }
const box = (style: Record<string, unknown>, children?: unknown): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, ...(children !== undefined ? { children } : {}) },
})
const image = (src: string, style: Record<string, unknown>): Node => ({ type: 'img', props: { src, style } })

function front(d: CardData, p: CardPalette): Node {
  const kids: unknown[] = [
    box({ position: 'absolute', top: 18, left: 18, width: W - 36, height: H - 36, border: `6px solid ${p.border}`, borderRadius: 22 }),
    box({ fontSize: 56, color: p.text, marginTop: 8, textAlign: 'center', lineHeight: 1 }, d.name.toUpperCase()),
  ]
  if (d.subline) kids.push(box({ fontSize: 24, color: p.accent, marginTop: 6, letterSpacing: 1 }, d.subline.toUpperCase()))
  if (d.school) kids.push(box({ fontSize: 16, color: '#bdbdbd', marginTop: 2 }, d.school))
  kids.push(image(d.photoDataUrl, { width: 700, height: 700, objectFit: 'cover', borderRadius: 14, marginTop: 18 }))
  if (d.stats) kids.push(box({ fontSize: 26, color: p.accent, marginTop: 18, textAlign: 'center' }, d.stats))
  if (d.tagline) kids.push(box({ fontSize: 30, color: p.text, marginTop: 10, textAlign: 'center' }, `"${d.tagline}"`))
  kids.push(box({ position: 'absolute', bottom: 28, right: 36, fontSize: 14, color: p.accent, opacity: 0.65 }, `${d.styleLabel} · ${new Date().getFullYear()}`))
  return box(
    { width: W, height: H, flexDirection: 'column', alignItems: 'center', background: p.bg, padding: 36, position: 'relative', fontFamily: 'Anton' },
    kids
  )
}

function back(d: CardData, p: CardPalette): Node {
  const kids: unknown[] = [
    box({ position: 'absolute', top: 18, left: 18, width: W - 36, height: H - 36, border: `6px solid ${p.border}`, borderRadius: 22 }),
  ]
  if (d.logoDataUrl) kids.push(image(d.logoDataUrl, { width: 340, height: 340, objectFit: 'contain', marginTop: 130 }))
  kids.push(box({ fontSize: 46, color: p.text, marginTop: 28, textAlign: 'center' }, d.name.toUpperCase()))
  if (d.subline) kids.push(box({ fontSize: 22, color: p.accent, marginTop: 8 }, d.subline.toUpperCase()))
  if (d.tagline) kids.push(box({ fontSize: 26, color: p.text, marginTop: 26, textAlign: 'center', opacity: 0.92 }, `"${d.tagline}"`))
  const contact: unknown[] = []
  if (d.handle) contact.push(box({ fontSize: 24, color: p.accent }, d.handle))
  if (d.website) contact.push(box({ fontSize: 20, color: p.text, marginTop: 8 }, d.website))
  if (contact.length) kids.push(box({ flexDirection: 'column', alignItems: 'center', position: 'absolute', bottom: 80, left: 0, width: W }, contact))
  return box(
    { width: W, height: H, flexDirection: 'column', alignItems: 'center', background: p.bg, padding: 36, position: 'relative', fontFamily: 'Anton' },
    kids
  )
}

export async function renderTradingCard(d: CardData, p: CardPalette, sharp: typeof SharpType): Promise<Buffer | null> {
  const font = await loadFont()
  if (!font) return null
  const fonts = [{ name: 'Anton', data: font, weight: 400 as const, style: 'normal' as const }]
  const [frontSvg, backSvg] = await Promise.all([
    satori(front(d, p) as never, { width: W, height: H, fonts }),
    satori(back(d, p) as never, { width: W, height: H, fonts }),
  ])
  const [frontPng, backPng] = await Promise.all([
    sharp(Buffer.from(frontSvg)).png().toBuffer(),
    sharp(Buffer.from(backSvg)).png().toBuffer(),
  ])
  const gap = 40
  return sharp({ create: { width: W * 2 + gap, height: H, channels: 4, background: { r: 17, g: 17, b: 20, alpha: 1 } } })
    .composite([
      { input: frontPng, left: 0, top: 0 },
      { input: backPng, left: W + gap, top: 0 },
    ])
    .png()
    .toBuffer()
}
