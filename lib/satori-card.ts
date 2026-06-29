/**
 * Trading-card renderer using satori (pure-JS) — text is converted to vector
 * PATHS using an embedded font, so the card renders correctly on serverless
 * where librsvg has no fonts (the old SVG-text approach produced tofu boxes).
 * Renders front + back side-by-side into one PNG.
 */
import satori from 'satori'
import type SharpType from 'sharp'
import { ANTON_TTF_BASE64 } from './anton-font-data'

const W = 800
const H = 1120

// The font is embedded (base64) rather than fetched at runtime — the CDN fetch
// was 404ing on Vercel, so the card silently fell back to tofu. It can no
// longer fail.
let fontCache: Buffer | null = null
function loadFont(): Buffer {
  if (!fontCache) fontCache = Buffer.from(ANTON_TTF_BASE64, 'base64')
  return fontCache
}

export interface CardPalette {
  bg: string
  border: string
  accent: string
  text: string
}

export interface CardStat {
  label: string
  value: string
}

export interface CardData {
  name: string
  subline: string
  school: string
  stats: CardStat[]
  tagline: string
  photoDataUrl: string
  logoDataUrl?: string
  website?: string
  handle?: string
  /** Optional full-bleed effect background, composited behind everything. */
  bgImageDataUrl?: string
  /** Back-logo scale multiplier (1 = default 220px). */
  logoScale?: number
  /** Optional colour for the career-stats numbers (defaults to the text colour). */
  statColor?: string
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
  if (d.tagline) kids.push(box({ fontSize: 30, color: p.text, marginTop: 18, textAlign: 'center' }, `"${d.tagline}"`))
  kids.push(box({ position: 'absolute', bottom: 28, right: 36, fontSize: 14, color: p.accent, opacity: 0.65 }, `${new Date().getFullYear()}`))
  if (d.bgImageDataUrl)
    kids.unshift(image(d.bgImageDataUrl, { position: 'absolute', top: 0, left: 0, width: W, height: H, objectFit: 'cover' }))
  return box(
    { width: W, height: H, flexDirection: 'column', alignItems: 'center', background: p.bg, padding: 36, position: 'relative', fontFamily: 'Anton' },
    kids
  )
}

function back(d: CardData, p: CardPalette): Node {
  const kids: unknown[] = [
    box({ position: 'absolute', top: 18, left: 18, width: W - 36, height: H - 36, border: `6px solid ${p.border}`, borderRadius: 22 }),
  ]
  if (d.logoDataUrl) {
    const ls = Math.max(120, Math.min(560, Math.round(220 * (d.logoScale ?? 1))))
    kids.push(image(d.logoDataUrl, { width: ls, height: ls, objectFit: 'contain', marginTop: 64 }))
  }
  kids.push(box({ fontSize: 44, color: p.text, marginTop: 18, textAlign: 'center' }, d.name.toUpperCase()))
  if (d.subline) kids.push(box({ fontSize: 22, color: p.accent, marginTop: 8 }, d.subline.toUpperCase()))
  if (d.school) kids.push(box({ fontSize: 16, color: '#bdbdbd', marginTop: 4 }, d.school))

  const stats = d.stats.filter((s) => (s.value || s.label).trim())
  if (stats.length) {
    kids.push(box({ fontSize: 18, color: p.accent, marginTop: 30, letterSpacing: 3 }, 'CAREER STATS'))
    // One stat per line — value column then label, stacked vertically.
    const statRows = stats.slice(0, 8).map((s) =>
      box({ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', width: W - 200, marginTop: 16 }, [
        box({ fontSize: 44, color: d.statColor ?? p.text, lineHeight: 1.1, width: 150, textAlign: 'right' }, s.value || '—'),
        box({ fontSize: 22, color: p.accent, opacity: 0.85, marginLeft: 18, lineHeight: 1.1 }, (s.label || '').toUpperCase()),
      ])
    )
    kids.push(box({ flexDirection: 'column', alignItems: 'center', width: W - 120, marginTop: 6 }, statRows))
  }

  if (d.tagline) kids.push(box({ fontSize: 24, color: p.text, marginTop: 30, textAlign: 'center', opacity: 0.92 }, `"${d.tagline}"`))
  const contact: unknown[] = []
  if (d.handle) contact.push(box({ fontSize: 24, color: p.accent }, d.handle))
  if (d.website) contact.push(box({ fontSize: 20, color: p.text, marginTop: 8 }, d.website))
  if (contact.length) kids.push(box({ flexDirection: 'column', alignItems: 'center', marginTop: 40 }, contact))
  if (d.bgImageDataUrl)
    kids.unshift(image(d.bgImageDataUrl, { position: 'absolute', top: 0, left: 0, width: W, height: H, objectFit: 'cover' }))
  return box(
    { width: W, height: H, flexDirection: 'column', alignItems: 'center', background: p.bg, padding: 36, position: 'relative', fontFamily: 'Anton' },
    kids
  )
}

export async function renderTradingCard(d: CardData, p: CardPalette, sharp: typeof SharpType): Promise<Buffer | null> {
  try {
    const fonts = [{ name: 'Anton', data: loadFont(), weight: 400 as const, style: 'normal' as const }]
    const [frontSvg, backSvg] = await Promise.all([
      satori(front(d, p) as never, { width: W, height: H, fonts }),
      satori(back(d, p) as never, { width: W, height: H, fonts }),
    ])
    const [frontPng, backPng] = await Promise.all([
      sharp(Buffer.from(frontSvg)).png().toBuffer(),
      sharp(Buffer.from(backSvg)).png().toBuffer(),
    ])
    const gap = 40
    return await sharp({ create: { width: W * 2 + gap, height: H, channels: 4, background: { r: 17, g: 17, b: 20, alpha: 1 } } })
      .composite([
        { input: frontPng, left: 0, top: 0 },
        { input: backPng, left: W + gap, top: 0 },
      ])
      .png()
      .toBuffer()
  } catch {
    return null
  }
}
