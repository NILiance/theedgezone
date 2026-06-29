'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DownloadLink } from '@/components/download-link'
import { ARSENAL_EFFECTS } from '@/lib/arsenal-tab-options'
import { effectCss } from '@/lib/effect-css'
import { LogoStyleToggle, type LogoStyle } from './logo-style-toggle'
import { generatePlacementAction, type PlacementState } from './placement-actions'

export function PlacementEditor({
  brandId,
  kind,
  label,
  canvasW,
  canvasH,
  hasFinal,
  logoUrl,
  transparentLogoUrl,
  brandPrimary,
  brandSecondary,
  circle,
}: {
  brandId: string
  kind: string
  label: string
  canvasW: number
  canvasH: number
  hasFinal: boolean
  logoUrl: string
  transparentLogoUrl: string
  brandPrimary: string | null
  brandSecondary: string | null
  circle?: boolean
}) {
  const [state, action, pending] = useActionState<PlacementState, FormData>(
    generatePlacementAction,
    {}
  )
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 })
  const [scale, setScale] = useState(0.45)
  const [bgColor, setBgColor] = useState(brandPrimary ?? '#0b1e3f')
  const [effect, setEffect] = useState('none')
  const [effectColor, setEffectColor] = useState(brandSecondary ?? '#ffd166')
  const [logoStyle, setLogoStyle] = useState<LogoStyle>('transparent')
  const stageRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const router = useRouter()
  const lastUrl = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (state.url && state.url !== lastUrl.current) {
      lastUrl.current = state.url
      router.refresh()
    }
  }, [state.url, router])

  if (!hasFinal) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
        <p className="text-eyebrow text-accent">🔒 {label} Locked</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a final logo first — every Arsenal asset is built around it.
        </p>
      </div>
    )
  }

  const aspect = canvasW / canvasH
  let dispW: number
  let dispH: number
  if (aspect >= 1) {
    dispW = 360
    dispH = Math.round(360 / aspect)
  } else {
    dispH = 440
    dispW = Math.round(440 * aspect)
  }

  const hasEffect = effect !== 'none'
  const previewLogo = logoStyle === 'transparent' ? transparentLogoUrl || logoUrl : logoUrl
  const labelCls =
    'text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground'

  function moveTo(clientX: number, clientY: number) {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({
      x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
    })
  }

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">{label}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        Drag your logo where you want it, size it, pick a background color, and add an optional
        effect. {canvasW}×{canvasH} px.
      </p>

      <div className="mx-auto mt-6 grid max-w-3xl items-start gap-6 lg:grid-cols-[auto_1fr]">
        {/* Stage */}
        <div className="mx-auto">
          <div
            ref={stageRef}
            className={`relative mx-auto select-none overflow-hidden border border-border shadow-inner ${circle ? 'rounded-full' : 'rounded-[var(--radius)]'}`}
            style={{
              width: dispW,
              height: dispH,
              background: hasEffect ? effectCss(effect, effectColor, bgColor) : bgColor,
            }}
            onPointerMove={(e) => {
              if (dragging.current) moveTo(e.clientX, e.clientY)
            }}
            onPointerUp={() => (dragging.current = false)}
            onPointerLeave={() => (dragging.current = false)}
          >
            {previewLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewLogo}
                alt="Logo"
                draggable={false}
                onPointerDown={(e) => {
                  dragging.current = true
                  e.currentTarget.setPointerCapture(e.pointerId)
                  moveTo(e.clientX, e.clientY)
                }}
                className="absolute cursor-move object-contain"
                style={{
                  width: scale * dispW,
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ) : null}
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">Drag the logo to position it.</p>
        </div>

        {/* Controls */}
        <form action={action} className="grid gap-3">
          <input type="hidden" name="brand_id" value={brandId} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="x" value={pos.x} />
          <input type="hidden" name="y" value={pos.y} />
          <input type="hidden" name="scale" value={scale} />
          <input type="hidden" name="bg_color" value={bgColor} />
          <input type="hidden" name="effect" value={effect} />
          <input type="hidden" name="effect_color" value={effectColor} />
          <input type="hidden" name="logo_style" value={logoStyle} />

          <label className="block">
            <span className={labelCls}>Logo size · {Math.round(scale * 100)}%</span>
            <input
              type="range"
              min={0.08}
              max={0.95}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className={labelCls}>Background</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="mt-1 h-9 w-16 cursor-pointer rounded border border-border bg-background"
              />
            </label>
            {hasEffect && (
              <label className="block">
                <span className={labelCls}>Effect color</span>
                <input
                  type="color"
                  value={effectColor}
                  onChange={(e) => setEffectColor(e.target.value)}
                  className="mt-1 h-9 w-16 cursor-pointer rounded border border-border bg-background"
                />
              </label>
            )}
            <LogoStyleToggle value={logoStyle} onChange={setLogoStyle} />
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
            {hasEffect && (
              <span className="mt-1 block text-[10px] text-muted-foreground">
                A branded effect backdrop is rendered behind the logo on generate.
              </span>
            )}
          </label>

          <button
            type="submit"
            disabled={pending}
            className="text-display mt-1 rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Generating…' : `Generate ${label}`}
          </button>
          {state.error && <p className="text-xs text-destructive">{state.error}</p>}
          {state.url && (
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-success/40 bg-success/5 p-4 text-center">
              <p className="text-display text-sm font-bold text-success">✓ Ready</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.url}
                alt={label}
                className={`max-h-64 w-auto border border-border ${circle ? 'rounded-full' : 'rounded-md'}`}
              />
              <DownloadLink
                url={state.url}
                filename={`${kind}.png`}
                className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
              >
                ⬇ Download
              </DownloadLink>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
