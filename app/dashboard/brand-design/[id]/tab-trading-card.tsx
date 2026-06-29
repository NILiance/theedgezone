'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ARSENAL_EFFECTS } from '@/lib/arsenal-tab-options'
import { LogoStyleToggle } from './logo-style-toggle'
import { effectCss } from '@/lib/effect-css'
import {
  generateTradingCardAction,
  type TradingCardActionState,
} from './arsenal-tab-actions'
import {
  TradingCardOrderPanel,
  type OrderTier,
  type OrderableCard,
} from './trading-card-order'

const QUICK_PALETTES = [
  { key: 'modern', name: 'Brand' },
  { key: 'vintage', name: 'Vintage' },
  { key: 'holographic', name: 'Holographic' },
  { key: 'premium_gold', name: 'Gold' },
]

interface Palette {
  bg: string
  border: string
  accent: string
  text: string
}

interface Stat {
  label: string
  value: string
}

function readableText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return '#ffffff'
  const n = parseInt(m[1]!, 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? '#111111' : '#ffffff'
}

export function TradingCardTab({
  brandId,
  hasFinal,
  tiers,
  cards,
  orderSuccess,
  brandName,
  logoUrl,
  transparentLogoUrl,
  brandPrimary,
  brandSecondary,
}: {
  brandId: string
  hasFinal: boolean
  tiers: OrderTier[]
  cards: OrderableCard[]
  orderSuccess?: boolean
  brandName: string
  logoUrl: string
  transparentLogoUrl: string
  brandPrimary: string
  brandSecondary: string
}) {
  const [state, action, pending] = useActionState<TradingCardActionState, FormData>(
    generateTradingCardAction,
    {}
  )
  const [style, setStyle] = useState('custom')
  const [bg, setBg] = useState(brandPrimary || '#0b1e3f')
  const [accent, setAccent] = useState(brandSecondary || '#ffd166')
  const [effect, setEffect] = useState('none')
  const [logoStyle, setLogoStyle] = useState<'transparent' | 'regular'>('transparent')
  const [logoScale, setLogoScale] = useState(1)
  const [statColor, setStatColor] = useState('#ffffff')
  const [showBackName, setShowBackName] = useState(true)
  const [flipped, setFlipped] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [stats, setStats] = useState<Stat[]>([{ label: '', value: '' }])
  const [f, setF] = useState({
    name: brandName || '',
    subline: '',
    school: '',
    tagline: '',
    handle: '',
    website: '',
  })
  useRefreshOnNewUrl(state.url)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }))

  // Quick palettes just seed the colour pickers; the talent then tweaks freely.
  function presetColors(s: string): { bg: string; accent: string } {
    switch (s) {
      case 'vintage':
        return { bg: '#1a0f08', accent: '#caa86a' }
      case 'holographic':
        return { bg: '#0a0a0e', accent: '#22d3ee' }
      case 'premium_gold':
        return { bg: '#101010', accent: '#FFD700' }
      case 'modern':
        return { bg: brandPrimary || '#0b1e3f', accent: brandSecondary || '#ffd166' }
      default:
        return { bg, accent }
    }
  }
  function applyPalette(s: string) {
    setStyle(s)
    const c = presetColors(s)
    setBg(c.bg)
    setAccent(c.accent)
  }

  const setStat = (i: number, key: keyof Stat, val: string) =>
    setStats((arr) => arr.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)))
  const addStat = () => setStats((arr) => (arr.length >= 8 ? arr : [...arr, { label: '', value: '' }]))
  const removeStat = (i: number) =>
    setStats((arr) => (arr.length <= 1 ? [{ label: '', value: '' }] : arr.filter((_, idx) => idx !== i)))

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const r = new FileReader()
    r.onload = () => setPhoto(r.result as string)
    r.readAsDataURL(file)
  }

  if (!hasFinal) return <LockedNotice label="Trading Card" />

  const p: Palette = { bg, border: accent, accent, text: readableText(bg) }
  const previewLogo = logoStyle === 'transparent' ? transparentLogoUrl || logoUrl : logoUrl
  const cleanStats = stats.filter((s) => s.label.trim() || s.value.trim())
  const inputCls = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
  const labelCls =
    'text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground'

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Trading Card Designer</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        Design the front and back live — flip the card to edit the back. Your photo anchors the
        front; your stats, logo and contact go on the back. Pick your colors, add an optional
        background effect, then Generate a print-ready front + back.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Controls */}
        <form action={action} className="grid gap-3">
          <input type="hidden" name="brand_id" value={brandId} />
          <input type="hidden" name="style" value={style} />
          <input type="hidden" name="effect" value={effect} />
          <input type="hidden" name="logo_style" value={logoStyle} />
          <input type="hidden" name="logo_scale" value={logoScale} />
          <input type="hidden" name="stat_color" value={statColor} />
          <input type="hidden" name="hide_back_name" value={showBackName ? '' : '1'} />
          <input type="hidden" name="bg_color" value={bg} />
          <input type="hidden" name="accent_color" value={accent} />
          <input type="hidden" name="name" value={f.name} />
          <input type="hidden" name="subline" value={f.subline} />
          <input type="hidden" name="school" value={f.school} />
          <input type="hidden" name="stats_json" value={JSON.stringify(cleanStats)} />
          <input type="hidden" name="tagline" value={f.tagline} />
          <input type="hidden" name="handle" value={f.handle} />
          <input type="hidden" name="website" value={f.website} />

          <label className="block">
            <span className={labelCls}>Action Photo (front, required)</span>
            <input
              type="file"
              name="photo"
              accept="image/png,image/jpeg"
              required
              onChange={onPhoto}
              className="mt-1 block w-full rounded-md border border-border bg-panel-elevated px-3 py-2 text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-[var(--radius-sm)] file:border file:border-border file:bg-panel-elevated file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-foreground hover:file:bg-primary hover:file:text-primary-foreground"
            />
          </label>

          <p className="text-display text-[10px] font-bold uppercase tracking-widest text-primary">
            Front
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={f.name} onChange={set('name')} placeholder="Name" className={inputCls} />
            <input value={f.subline} onChange={set('subline')} placeholder="Position · Sport" className={inputCls} />
            <input value={f.school} onChange={set('school')} placeholder="School / Team" className={inputCls} />
            <input value={f.tagline} onChange={set('tagline')} placeholder="Tagline" className={inputCls} />
          </div>

          <p className="text-display mt-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            Back <span className="font-normal normal-case text-muted-foreground">(logo + name auto-included)</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={f.handle} onChange={set('handle')} placeholder="@handle" className={inputCls} />
            <input value={f.website} onChange={set('website')} placeholder="website.com" className={inputCls} />
          </div>
          <div className="grid items-end gap-3 sm:grid-cols-2">
            <LogoStyleToggle value={logoStyle} onChange={setLogoStyle} label="Back logo" />
            <label className="block">
              <span className={labelCls}>Back logo size · {Math.round(logoScale * 100)}%</span>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={logoScale}
                onChange={(e) => setLogoScale(Number(e.target.value))}
                className="mt-2 w-full cursor-pointer"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showBackName}
              onChange={(e) => setShowBackName(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Show name on back
          </label>

          {/* Multiple stats → rendered on the back, one per line */}
          <div>
            <span className={labelCls}>Stats (on the back — name + value)</span>
            <div className="mt-1 grid gap-2">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={s.label}
                    onChange={(e) => setStat(i, 'label', e.target.value)}
                    placeholder="Stat name (e.g. Career Yards)"
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    value={s.value}
                    onChange={(e) => setStat(i, 'value', e.target.value)}
                    placeholder="1500"
                    className="w-24 shrink-0 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeStat(i)}
                    aria-label="Remove stat"
                    className="shrink-0 rounded-md border border-border px-2.5 py-2 text-xs text-muted-foreground hover:bg-panel hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {stats.length < 8 && (
              <button
                type="button"
                onClick={addStat}
                className="text-display mt-2 rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-panel"
              >
                + Add stat
              </button>
            )}
          </div>

          {/* Colors */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Background color</span>
              <input
                type="color"
                value={bg}
                onChange={(e) => {
                  setBg(e.target.value)
                  setStyle('custom')
                }}
                className="mt-1 h-10 w-full cursor-pointer rounded-md border border-border bg-background p-1"
              />
            </label>
            <label className="block">
              <span className={labelCls}>Accent / border</span>
              <input
                type="color"
                value={accent}
                onChange={(e) => {
                  setAccent(e.target.value)
                  setStyle('custom')
                }}
                className="mt-1 h-10 w-full cursor-pointer rounded-md border border-border bg-background p-1"
              />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Stats number color</span>
            <input
              type="color"
              value={statColor}
              onChange={(e) => setStatColor(e.target.value)}
              className="mt-1 h-9 w-24 cursor-pointer rounded-md border border-border bg-background p-1"
            />
          </label>
          <div>
            <span className={labelCls}>Quick palette</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {QUICK_PALETTES.map((q) => {
                const c = presetColors(q.key)
                return (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => applyPalette(q.key)}
                    className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-panel"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: c.bg, border: `1px solid ${c.accent}` }} />
                    {q.name}
                  </button>
                )
              })}
            </div>
          </div>
          <label className="block">
            <span className={labelCls}>Background Effect</span>
            <select
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {ARSENAL_EFFECTS.map((eff) => (
                <option key={eff.val} value={eff.val}>
                  {eff.name}
                </option>
              ))}
            </select>
            {effect !== 'none' && (
              <span className="mt-1 block text-[10px] text-muted-foreground">
                A branded effect is rendered behind the card on generate.
              </span>
            )}
          </label>

          <div className="mt-1 flex justify-center">
            <button
              type="submit"
              disabled={pending}
              className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              {pending ? 'Generating…' : 'Generate Card'}
            </button>
          </div>
        </form>

        {/* Live preview with 3D flip */}
        <div className="flex flex-col items-center gap-3">
          <CardFlip
            flipped={flipped}
            palette={p}
            photo={photo}
            logoUrl={previewLogo}
            f={f}
            stats={cleanStats}
            effect={effect}
            logoScale={logoScale}
            statColor={statColor}
            showBackName={showBackName}
          />
          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            className="text-display rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-panel"
          >
            ↻ Flip to {flipped ? 'front' : 'back'}
          </button>
          <p className="text-center text-[10px] text-muted-foreground">Live preview — the generated card is print-ready.</p>
        </div>
      </div>

      {state.url && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-[var(--radius)] border border-success/40 bg-success/5 p-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.url} alt="Generated trading card front and back" className="max-h-[400px] w-auto rounded-md border border-border" />
          <p className="text-[10px] text-muted-foreground">
            Front + back, side by side. Saved to Your Creations below — download or order from there.
          </p>
        </div>
      )}
      {state.error && <p className="mt-4 text-center text-xs text-destructive">{state.error}</p>}

      <TradingCardOrderPanel brandId={brandId} tiers={tiers} cards={cards} orderSuccess={orderSuccess} />
    </div>
  )
}

function CardFlip({
  flipped,
  palette,
  photo,
  logoUrl,
  f,
  stats,
  effect,
  logoScale,
  statColor,
  showBackName,
}: {
  flipped: boolean
  palette: Palette
  photo: string | null
  logoUrl: string
  f: { name: string; subline: string; school: string; tagline: string; handle: string; website: string }
  stats: Stat[]
  effect: string
  logoScale: number
  statColor: string
  showBackName: boolean
}) {
  const year = new Date().getFullYear()
  return (
    <div style={{ perspective: 1200 }} className="w-[260px]">
      <div
        className="relative h-[364px] w-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          <CardShell palette={palette} effect={effect}>
            <p className="text-display text-center text-lg font-black leading-none" style={{ color: palette.text }}>
              {(f.name || 'YOUR NAME').toUpperCase()}
            </p>
            {f.subline && <p className="text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: palette.accent }}>{f.subline}</p>}
            {f.school && <p className="text-center text-[9px] text-white/60">{f.school}</p>}
            <div className="mt-1 aspect-square w-full overflow-hidden rounded-md bg-black/40">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[9px] text-white/40">action photo</div>
              )}
            </div>
            {f.tagline && <p className="mt-1 text-center text-xs font-bold italic" style={{ color: palette.accent }}>&ldquo;{f.tagline}&rdquo;</p>}
            <p className="mt-auto text-right text-[10px]" style={{ color: palette.accent, opacity: 0.7 }}>{year}</p>
          </CardShell>
        </div>
        {/* Back */}
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <CardShell palette={palette} effect={effect}>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="max-h-full object-contain"
                  style={{ width: 64 * logoScale, height: 64 * logoScale }}
                />
              ) : null}
              {showBackName && (
                <p className="text-display text-center text-base font-black leading-none" style={{ color: palette.text }}>{(f.name || 'YOUR NAME').toUpperCase()}</p>
              )}
              {f.subline && <p className="text-center text-[9px] font-bold uppercase tracking-widest" style={{ color: palette.accent }}>{f.subline}</p>}
              {stats.length > 0 && (
                <div className="mt-1 flex w-full flex-col items-center gap-1">
                  {stats.slice(0, 8).map((s, i) => (
                    <div key={i} className="flex w-full max-w-full items-baseline justify-center gap-1.5 leading-tight">
                      <span className="shrink-0 text-xs font-black" style={{ color: statColor }}>{s.value || '—'}</span>
                      <span className="min-w-0 truncate text-[10px] uppercase tracking-wider" style={{ color: palette.accent }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {f.tagline && <p className="mt-1 text-center text-[11px] italic" style={{ color: palette.text, opacity: 0.9 }}>&ldquo;{f.tagline}&rdquo;</p>}
            </div>
            <div className="text-center">
              {f.handle && <p className="text-xs font-bold" style={{ color: palette.accent }}>{f.handle}</p>}
              {f.website && <p className="text-[10px]" style={{ color: palette.text }}>{f.website}</p>}
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  )
}

function CardShell({
  palette,
  effect,
  children,
}: {
  palette: Palette
  effect: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex h-full w-full flex-col gap-1 overflow-hidden rounded-xl p-3"
      style={{
        background: effect !== 'none' ? effectCss(effect, palette.accent, palette.bg) : palette.bg,
        border: `3px solid ${palette.border}`,
      }}
    >
      {children}
    </div>
  )
}

function LockedNotice({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
      <p className="text-eyebrow text-accent">🔒 {label} Locked</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a final logo first — every Arsenal asset is built around it.
      </p>
    </div>
  )
}

function useRefreshOnNewUrl(url: string | undefined) {
  const router = useRouter()
  const lastRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (url && url !== lastRef.current) {
      lastRef.current = url
      router.refresh()
    }
  }, [url, router])
}
