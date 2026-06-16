'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveCanvasOutput } from '@/app/dashboard/brand-design/actions'

/**
 * Logo Canvas Editor — matches the legacy WP plugin's 4-tool raster
 * editor (Erase / Text / Paint Bucket / Color Swap) on a 600×600 working
 * surface. Every tool snapshots ImageData before commit so per-tool undo
 * works; "Reset" rolls all the way back to the original logo.
 */

interface Props {
  brandId: string
  logoUrl: string
  defaults: {
    brand_name?: string | null
    sport?: string | null
    athletic_position?: string | null
    school?: string | null
    jersey_number?: string | null
    primary_color: string
    secondary_color: string
  }
}

type Tool = 'erase' | 'text' | 'bucket' | 'swap'

const CANVAS_SIZE = 600
const MAX_HISTORY = 25

// 48-ish fonts spanning a wide range — matches the legacy. All are
// system-safe + Google-Fonts-available so the canvas renders them when
// the editor mounts.
const FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Poppins',
  'Bebas Neue',
  'Anton',
  'Impact',
  'Arial Black',
  'Helvetica',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Playfair Display',
  'Merriweather',
  'Lora',
  'Cormorant Garamond',
  'Roboto Condensed',
  'Roboto Slab',
  'Roboto Mono',
  'Source Code Pro',
  'Inconsolata',
  'Courier New',
  'Cabin',
  'Quicksand',
  'Nunito',
  'PT Sans',
  'PT Serif',
  'Crimson Text',
  'Libre Baskerville',
  'Permanent Marker',
  'Pacifico',
  'Lobster',
  'Caveat',
  'Dancing Script',
  'Satisfy',
  'Shadows Into Light',
  'Russo One',
  'Black Ops One',
  'Bungee',
  'Fjalla One',
  'Archivo Black',
  'Special Elite',
  'Audiowide',
  'Press Start 2P',
] as const

const ARCH_PRESETS = [
  { label: 'Arch Up', value: -120 },
  { label: 'Flat', value: 0 },
  { label: 'Arch Down', value: 120 },
] as const

export function LogoCanvas({ brandId, logoUrl, defaults }: Props) {
  // ── refs ────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)

  // ── core state ──────────────────────────────────────────────────────
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [tool, setTool] = useState<Tool>('text')
  const [zoom, setZoom] = useState(1)
  const [historyDepth, setHistoryDepth] = useState(0)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string; url?: string } | null>(
    null
  )
  const [isPending, startTransition] = useTransition()

  // Custom brand palette. Pre-seeded from the brand colors + classic
  // black/white/neutral grey set.
  const [palette, setPalette] = useState<string[]>(() =>
    Array.from(
      new Set([
        defaults.primary_color || '#000000',
        defaults.secondary_color || '#666666',
        '#ffffff',
        '#000000',
        '#e5e7eb',
        '#9ca3af',
      ])
    )
  )

  // ── tool-specific state ─────────────────────────────────────────────
  // ERASE
  const [eraseColor, setEraseColor] = useState('#ffffff')
  const [eraseSize, setEraseSize] = useState(30)
  const eraseStrokeRef = useRef<{ lastX: number; lastY: number } | null>(null)

  // TEXT (live preview overlay before "Apply")
  const [textValue, setTextValue] = useState('')
  const [textFont, setTextFont] = useState<string>('Bebas Neue')
  const [textSize, setTextSize] = useState(64)
  const [textBold, setTextBold] = useState(true)
  const [textItalic, setTextItalic] = useState(false)
  const [textUppercase, setTextUppercase] = useState(true)
  const [textColor, setTextColor] = useState(defaults.primary_color || '#000000')
  const [outlineWidth, setOutlineWidth] = useState(0)
  const [outlineColor, setOutlineColor] = useState('#ffffff')
  const [textX, setTextX] = useState(50)
  const [textY, setTextY] = useState(80)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [arch, setArch] = useState(0)

  // PAINT BUCKET
  const [bucketColor, setBucketColor] = useState(defaults.primary_color || '#000000')
  const [bucketTolerance, setBucketTolerance] = useState(32)

  // COLOR SWAP
  const [swapFrom, setSwapFrom] = useState<string | null>(null)
  const [swapTo, setSwapTo] = useState(defaults.secondary_color || '#000000')
  const [swapTolerance, setSwapTolerance] = useState(32)
  const [swapBlendLuminance, setSwapBlendLuminance] = useState(true)
  const [swapPicking, setSwapPicking] = useState(false)

  // EYEDROPPER (active across tools when toggled)
  const [eyedropper, setEyedropper] = useState<null | 'erase' | 'text' | 'bucket'>(null)

  // ── load the logo image once ────────────────────────────────────────
  useEffect(() => {
    if (!logoUrl) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setLogoImage(img)
    img.onerror = () => setLogoImage(null)
    img.src = logoUrl
  }, [logoUrl])

  // Draw the original logo onto the canvas when it arrives. Resets
  // history to just the initial snapshot.
  useEffect(() => {
    if (!logoImage) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    const scale = Math.min(
      CANVAS_SIZE / logoImage.width,
      CANVAS_SIZE / logoImage.height
    )
    const w = logoImage.width * scale
    const h = logoImage.height * scale
    ctx.drawImage(
      logoImage,
      (CANVAS_SIZE - w) / 2,
      (CANVAS_SIZE - h) / 2,
      w,
      h
    )
    snapshotPushRef.current?.()
  }, [logoImage])

  // ── history (per-tool undo via snapshots) ───────────────────────────
  const historyStackRef = useRef<ImageData[]>([])
  const snapshotPush = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    historyStackRef.current.push(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE))
    if (historyStackRef.current.length > MAX_HISTORY) {
      historyStackRef.current.shift()
    }
    setHistoryDepth(historyStackRef.current.length)
  }, [])
  // Stable ref so the load-logo effect can call it without re-running.
  const snapshotPushRef = useRef(snapshotPush)
  snapshotPushRef.current = snapshotPush

  const undoLast = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (historyStackRef.current.length <= 1) return
    historyStackRef.current.pop()
    const last = historyStackRef.current[historyStackRef.current.length - 1]!
    ctx.putImageData(last, 0, 0)
    setHistoryDepth(historyStackRef.current.length)
  }, [])

  const resetAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (historyStackRef.current.length === 0) return
    const first = historyStackRef.current[0]!
    ctx.putImageData(first, 0, 0)
    historyStackRef.current = [first]
    setHistoryDepth(1)
  }, [])

  // ── live text preview overlay ───────────────────────────────────────
  // The base canvas is committed pixels. Text preview floats on top via
  // a second canvas so the user can scrub controls without rasterizing.
  const previewRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const preview = previewRef.current
    if (!preview) return
    const ctx = preview.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    if (tool !== 'text' || !textValue.trim()) return
    drawText(ctx, getTextDrawOpts())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tool,
    textValue,
    textFont,
    textSize,
    textBold,
    textItalic,
    textUppercase,
    textColor,
    outlineWidth,
    outlineColor,
    textX,
    textY,
    letterSpacing,
    arch,
  ])

  function getTextDrawOpts() {
    return {
      text: textUppercase ? textValue.toUpperCase() : textValue,
      font: textFont,
      size: textSize,
      bold: textBold,
      italic: textItalic,
      color: textColor,
      outlineWidth,
      outlineColor,
      x: (textX / 100) * CANVAS_SIZE,
      y: (textY / 100) * CANVAS_SIZE,
      letterSpacing,
      arch,
    }
  }

  function applyText() {
    if (!textValue.trim()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawText(ctx, getTextDrawOpts())
    snapshotPush()
    setTextValue('')
  }

  // ── canvas pointer events (tool-dispatched) ─────────────────────────
  function canvasCoords(e: ReactPointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) * CANVAS_SIZE) / rect.width
    const y = ((e.clientY - rect.top) * CANVAS_SIZE) / rect.height
    return [Math.max(0, Math.min(CANVAS_SIZE - 1, x)), Math.max(0, Math.min(CANVAS_SIZE - 1, y))]
  }

  function pixelAt(x: number, y: number): [number, number, number, number] {
    const canvas = canvasRef.current
    if (!canvas) return [255, 255, 255, 255]
    const ctx = canvas.getContext('2d')
    if (!ctx) return [255, 255, 255, 255]
    const px = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
    return [px[0]!, px[1]!, px[2]!, px[3]!]
  }

  function onPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const [x, y] = canvasCoords(e)
    if (eyedropper) {
      const [r, g, b] = pixelAt(x, y)
      const hex = rgbToHex(r, g, b)
      if (eyedropper === 'erase') setEraseColor(hex)
      else if (eyedropper === 'text') setTextColor(hex)
      else if (eyedropper === 'bucket') setBucketColor(hex)
      setPalette((p) => Array.from(new Set([hex, ...p])).slice(0, 16))
      setEyedropper(null)
      return
    }
    if (swapPicking) {
      const [r, g, b] = pixelAt(x, y)
      const hex = rgbToHex(r, g, b)
      setSwapFrom(hex)
      setSwapPicking(false)
      return
    }
    if (tool === 'erase') {
      ;(e.target as Element).setPointerCapture(e.pointerId)
      eraseStrokeRef.current = { lastX: x, lastY: y }
      paintErase(x, y, x, y)
    } else if (tool === 'bucket') {
      floodFill(x, y, hexToRgba(bucketColor), bucketTolerance)
      snapshotPush()
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (tool !== 'erase' || !eraseStrokeRef.current) return
    const [x, y] = canvasCoords(e)
    const { lastX, lastY } = eraseStrokeRef.current
    paintErase(lastX, lastY, x, y)
    eraseStrokeRef.current = { lastX: x, lastY: y }
  }

  function onPointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (tool === 'erase' && eraseStrokeRef.current) {
      ;(e.target as Element).releasePointerCapture(e.pointerId)
      eraseStrokeRef.current = null
      snapshotPush()
    }
  }

  function paintErase(x0: number, y0: number, x1: number, y1: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = eraseColor
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = eraseSize
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }

  function floodFill(startX: number, startY: number, fill: [number, number, number, number], tolerance: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    const data = img.data
    const sx = Math.floor(startX)
    const sy = Math.floor(startY)
    const idx = (sy * CANVAS_SIZE + sx) * 4
    const sr = data[idx]!
    const sg = data[idx + 1]!
    const sb = data[idx + 2]!
    const tol2 = tolerance * tolerance
    const matches = (i: number) => {
      const dr = data[i]! - sr
      const dg = data[i + 1]! - sg
      const db = data[i + 2]! - sb
      return dr * dr + dg * dg + db * db <= tol2 * 3
    }
    // Scanline fill (iterative; avoids deep recursion)
    const stack: Array<[number, number]> = [[sx, sy]]
    while (stack.length) {
      const [x, y] = stack.pop()!
      let left = x
      let right = x
      const startIdx = (y * CANVAS_SIZE + x) * 4
      if (!matches(startIdx)) continue
      while (left > 0 && matches((y * CANVAS_SIZE + (left - 1)) * 4)) left--
      while (right < CANVAS_SIZE - 1 && matches((y * CANVAS_SIZE + (right + 1)) * 4)) right++
      for (let i = left; i <= right; i++) {
        const pi = (y * CANVAS_SIZE + i) * 4
        data[pi] = fill[0]
        data[pi + 1] = fill[1]
        data[pi + 2] = fill[2]
        data[pi + 3] = fill[3]
        if (y > 0 && matches(((y - 1) * CANVAS_SIZE + i) * 4)) stack.push([i, y - 1])
        if (y < CANVAS_SIZE - 1 && matches(((y + 1) * CANVAS_SIZE + i) * 4)) stack.push([i, y + 1])
      }
    }
    ctx.putImageData(img, 0, 0)
  }

  function applyColorSwap() {
    if (!swapFrom) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const [tr, tg, tb] = hexToRgba(swapTo)
    const [fr, fg, fb] = hexToRgba(swapFrom)
    const tol2 = swapTolerance * swapTolerance * 3
    const img = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    const data = img.data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!
      const g = data[i + 1]!
      const b = data[i + 2]!
      const dr = r - fr
      const dg = g - fg
      const db = b - fb
      const dist2 = dr * dr + dg * dg + db * db
      if (dist2 <= tol2) {
        if (swapBlendLuminance) {
          // Preserve luminance: lighter/darker variants stay relative.
          const srcLum = 0.299 * r + 0.587 * g + 0.114 * b
          const fromLum = 0.299 * fr + 0.587 * fg + 0.114 * fb
          const delta = (srcLum - fromLum) / 255
          data[i] = clamp255(tr + tr * delta)
          data[i + 1] = clamp255(tg + tg * delta)
          data[i + 2] = clamp255(tb + tb * delta)
        } else {
          data[i] = tr
          data[i + 1] = tg
          data[i + 2] = tb
        }
      }
    }
    ctx.putImageData(img, 0, 0)
    snapshotPush()
  }

  // ── zoom + pan ──────────────────────────────────────────────────────
  function onWheel(e: WheelEvent) {
    if (!e.shiftKey && !e.ctrlKey) return
    e.preventDefault()
    setZoom((z) => Math.max(1, Math.min(5, z + (e.deltaY < 0 ? 0.2 : -0.2))))
  }
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ── save flow ───────────────────────────────────────────────────────
  function exportPng(): string | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }

  function saveToBrand() {
    setBusy(true)
    setStatus(null)
    const dataUrl = exportPng()
    if (!dataUrl) {
      setBusy(false)
      return
    }
    const fd = new FormData()
    fd.set('brand_id', brandId)
    fd.set('data_url', dataUrl)
    fd.set('filename', `logo-modified-${Date.now()}.png`)
    fd.set(
      'layers_meta',
      JSON.stringify({
        tool_history: historyStackRef.current.length,
        palette,
      })
    )
    startTransition(async () => {
      const res = await saveCanvasOutput(fd)
      setBusy(false)
      setStatus({
        ok: res.ok,
        message: res.message ?? (res.ok ? 'Saved to your brand.' : 'Save failed'),
        url: res.url,
      })
    })
  }

  function downloadLocal() {
    const dataUrl = exportPng()
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `logo-modified-${Date.now()}.png`
    a.click()
  }

  // ── derived ─────────────────────────────────────────────────────────
  const canUndo = historyDepth > 1
  const eyedropperActive = eyedropper !== null || swapPicking
  const cursorClass = useMemo(() => {
    if (eyedropperActive) return 'cursor-crosshair'
    if (tool === 'erase') return 'cursor-cell'
    if (tool === 'bucket') return 'cursor-pointer'
    if (tool === 'swap' && swapPicking) return 'cursor-crosshair'
    return 'cursor-default'
  }, [tool, eyedropperActive, swapPicking])

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* ── Left: stage ───────────────────────────────────────────── */}
      <div
        ref={stageRef}
        className="relative flex max-w-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40 p-3"
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {/* Tool tabs */}
          <div className="inline-flex overflow-hidden rounded-[var(--radius-sm)] border border-border bg-background">
            {(
              [
                { id: 'erase', label: 'Erase', icon: '🧽' },
                { id: 'text', label: 'Text', icon: 'T' },
                { id: 'bucket', label: 'Paint Bucket', icon: '🪣' },
                { id: 'swap', label: 'Color Swap', icon: '🎨' },
              ] as Array<{ id: Tool; label: string; icon: string }>
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTool(t.id)
                  setEyedropper(null)
                  setSwapPicking(false)
                }}
                className={`text-display inline-flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  tool === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-panel/60'
                }`}
              >
                <span aria-hidden>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Zoom {zoom.toFixed(1)}×
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-xs"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(5, z + 0.2))}
              className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-xs"
            >
              +
            </button>
            <button
              type="button"
              onClick={undoLast}
              disabled={!canUndo}
              className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-xs disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="relative mx-auto overflow-auto rounded-[var(--radius-sm)] bg-white shadow-elevated">
          <div
            className="relative"
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className={`block touch-none ${cursorClass}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
            <canvas
              ref={previewRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="pointer-events-none absolute inset-0"
            />
          </div>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          {tool === 'erase' &&
            'Paint over anything you want to remove. The brush fills with the chosen background color.'}
          {tool === 'text' &&
            'Type, style, position, then click Apply to stamp the text onto the logo.'}
          {tool === 'bucket' &&
            'Click any enclosed area to flood-fill it with the chosen color. Adjust tolerance for tighter / looser matches.'}
          {tool === 'swap' &&
            'Pick a color from the logo, choose a new color, then Swap to recolor every matching pixel.'}
          {' Shift + scroll to zoom up to 5×.'}
        </p>
      </div>

      {/* ── Right: sidebar with tool controls ─────────────────────── */}
      <aside className="space-y-4">
        {tool === 'erase' && (
          <Panel title="Erase tool">
            <Label>Brush color</Label>
            <ColorRow
              value={eraseColor}
              onChange={setEraseColor}
              palette={palette}
              onEyedrop={() => setEyedropper('erase')}
            />
            <Slider label={`Brush size (${eraseSize}px)`} min={4} max={120} value={eraseSize} onChange={setEraseSize} />
            <p className="mt-2 text-[10px] text-muted-foreground">
              Tip: sample the existing background color with the eyedropper for invisible erasing.
            </p>
          </Panel>
        )}

        {tool === 'text' && (
          <>
            <Panel title="Text">
              <Label>Text</Label>
              <Input
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={defaults.brand_name?.toUpperCase() ?? 'Type something'}
                className="mb-2"
              />
              <div className="flex flex-wrap gap-2 text-[10px]">
                <Quick
                  label="Name"
                  onClick={() =>
                    setTextValue(textUppercase ? (defaults.brand_name ?? '').toUpperCase() : defaults.brand_name ?? '')
                  }
                  show={!!defaults.brand_name}
                />
                <Quick
                  label="Position"
                  onClick={() => setTextValue(defaults.athletic_position?.toUpperCase() ?? '')}
                  show={!!defaults.athletic_position}
                />
                <Quick
                  label={`#${defaults.jersey_number ?? ''}`}
                  onClick={() => setTextValue(`#${defaults.jersey_number ?? ''}`)}
                  show={!!defaults.jersey_number}
                />
                <Quick
                  label="School"
                  onClick={() => setTextValue(defaults.school?.toUpperCase() ?? '')}
                  show={!!defaults.school}
                />
              </div>
            </Panel>

            <Panel title="Style">
              <Label>Font</Label>
              <select
                value={textFont}
                onChange={(e) => setTextFont(e.target.value)}
                className="flex h-9 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
                style={{ fontFamily: textFont }}
              >
                {FONTS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </select>
              <Slider label={`Size (${textSize}px)`} min={10} max={200} value={textSize} onChange={setTextSize} />
              <div className="grid grid-cols-3 gap-2">
                <Toggle on={textBold} onClick={() => setTextBold((v) => !v)} label="B" />
                <Toggle on={textItalic} onClick={() => setTextItalic((v) => !v)} label="I" italic />
                <Toggle on={textUppercase} onClick={() => setTextUppercase((v) => !v)} label="AA" />
              </div>
              <Label>Text color</Label>
              <ColorRow
                value={textColor}
                onChange={setTextColor}
                palette={palette}
                onEyedrop={() => setEyedropper('text')}
              />
              <Slider
                label={`Letter spacing (${letterSpacing}px)`}
                min={-10}
                max={40}
                value={letterSpacing}
                onChange={setLetterSpacing}
              />
            </Panel>

            <Panel title="Outline">
              <Slider label={`Width (${outlineWidth}px)`} min={0} max={16} value={outlineWidth} onChange={setOutlineWidth} />
              <Label>Outline color</Label>
              <ColorRow
                value={outlineColor}
                onChange={setOutlineColor}
                palette={palette}
              />
            </Panel>

            <Panel title="Position & Arch">
              <Slider label={`X (${textX}%)`} min={5} max={95} value={textX} onChange={setTextX} />
              <Slider label={`Y (${textY}%)`} min={5} max={95} value={textY} onChange={setTextY} />
              <Slider label={`Arch (${arch}°)`} min={-180} max={180} value={arch} onChange={setArch} />
              <div className="mt-1 flex flex-wrap gap-1">
                {ARCH_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setArch(p.value)}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-[10px]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Panel>

            <button
              type="button"
              onClick={applyText}
              disabled={!textValue.trim()}
              className="text-display w-full rounded-[var(--radius-sm)] bg-primary px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              Apply text to logo
            </button>
          </>
        )}

        {tool === 'bucket' && (
          <Panel title="Paint bucket">
            <Label>Fill color</Label>
            <ColorRow
              value={bucketColor}
              onChange={setBucketColor}
              palette={palette}
              onEyedrop={() => setEyedropper('bucket')}
            />
            <Slider
              label={`Tolerance (${bucketTolerance})`}
              min={0}
              max={128}
              value={bucketTolerance}
              onChange={setBucketTolerance}
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              Click any enclosed area on the canvas to flood-fill.
            </p>
          </Panel>
        )}

        {tool === 'swap' && (
          <Panel title="Color swap">
            <Label>From color</Label>
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-[var(--radius-sm)] border border-border"
                style={{ background: swapFrom ?? 'transparent' }}
              />
              <button
                type="button"
                onClick={() => setSwapPicking(true)}
                className={`flex-1 rounded-[var(--radius-sm)] border border-border px-3 py-2 text-xs ${
                  swapPicking ? 'bg-primary/10 text-primary' : 'bg-background'
                }`}
              >
                {swapPicking ? 'Click any color on the canvas' : swapFrom ?? 'Pick from canvas'}
              </button>
            </div>
            <Label className="mt-3">To color</Label>
            <ColorRow value={swapTo} onChange={setSwapTo} palette={palette} />
            <Slider
              label={`Tolerance (${swapTolerance})`}
              min={0}
              max={128}
              value={swapTolerance}
              onChange={setSwapTolerance}
            />
            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={swapBlendLuminance}
                onChange={(e) => setSwapBlendLuminance(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Blend luminance (keep highlights / shadows)
            </label>
            <button
              type="button"
              onClick={applyColorSwap}
              disabled={!swapFrom}
              className="text-display mt-3 w-full rounded-[var(--radius-sm)] bg-primary px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              Swap now
            </button>
          </Panel>
        )}

        <Panel title="Save">
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveToBrand} disabled={busy || isPending} size="sm">
              {isPending ? 'Saving…' : 'Save to brand'}
            </Button>
            <Button variant="outline" onClick={downloadLocal} size="sm">
              Download PNG
            </Button>
          </div>
          {status && (
            <p className={`mt-2 text-xs ${status.ok ? 'text-success' : 'text-destructive'}`}>
              {status.message}
              {status.url && (
                <>
                  {' '}
                  <a href={status.url} target="_blank" rel="noopener noreferrer" className="underline">
                    Open
                  </a>
                </>
              )}
            </p>
          )}
        </Panel>
      </aside>
    </div>
  )
}

// ── Drawing helper for the text tool (arched + outlined) ─────────────

function drawText(
  ctx: CanvasRenderingContext2D,
  opts: {
    text: string
    font: string
    size: number
    bold: boolean
    italic: boolean
    color: string
    outlineWidth: number
    outlineColor: string
    x: number
    y: number
    letterSpacing: number
    arch: number
  }
) {
  ctx.save()
  const style = `${opts.italic ? 'italic ' : ''}${opts.bold ? '700' : '400'} ${opts.size}px ${opts.font}, sans-serif`
  ctx.font = style
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const stroke = (cb: () => void) => {
    if (opts.outlineWidth > 0) {
      ctx.lineWidth = opts.outlineWidth
      ctx.lineJoin = 'round'
      ctx.strokeStyle = opts.outlineColor
      cb()
    }
  }
  if (Math.abs(opts.arch) < 1) {
    // Straight text with letter-spacing
    const chars = Array.from(opts.text)
    const widths = chars.map((c) => ctx.measureText(c).width)
    const total =
      widths.reduce((s, w) => s + w, 0) + opts.letterSpacing * Math.max(0, chars.length - 1)
    let cursor = opts.x - total / 2
    for (let i = 0; i < chars.length; i++) {
      const w = widths[i]!
      const cx = cursor + w / 2
      stroke(() => ctx.strokeText(chars[i]!, cx, opts.y))
      ctx.fillStyle = opts.color
      ctx.fillText(chars[i]!, cx, opts.y)
      cursor += w + opts.letterSpacing
    }
  } else {
    // Curve along arc. Positive arch = bend down (smile),
    // negative = bend up (frown). Radius scales inversely with degrees.
    const radius = (CANVAS_SIZE * 180) / (Math.abs(opts.arch) + 30)
    const chars = Array.from(opts.text)
    const widths = chars.map((c) => ctx.measureText(c).width)
    const total =
      widths.reduce((s, w) => s + w, 0) + opts.letterSpacing * Math.max(0, chars.length - 1)
    const arc = total / radius
    const sign = opts.arch > 0 ? 1 : -1
    const startAngle = -arc / 2
    const centerY = sign === 1 ? opts.y - radius : opts.y + radius
    let cursor = 0
    for (let i = 0; i < chars.length; i++) {
      const w = widths[i]!
      const charAngle = (cursor + w / 2) / radius
      const angle = startAngle + charAngle
      const tx = opts.x + sign * Math.sin(angle) * radius
      const ty = centerY + sign * Math.cos(angle) * radius
      ctx.save()
      ctx.translate(tx, ty)
      ctx.rotate(sign === 1 ? angle : -angle + Math.PI)
      stroke(() => ctx.strokeText(chars[i]!, 0, 0))
      ctx.fillStyle = opts.color
      ctx.fillText(chars[i]!, 0, 0)
      ctx.restore()
      cursor += w + opts.letterSpacing
    }
  }
  ctx.restore()
}

// ── Color helpers ────────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function hexToRgba(hex: string): [number, number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return [0, 0, 0, 255]
  const r = parseInt(m[1]!.substring(0, 2), 16)
  const g = parseInt(m[1]!.substring(2, 4), 16)
  const b = parseInt(m[1]!.substring(4, 6), 16)
  return [r, g, b, 255]
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

// ── Tiny UI atoms ────────────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow mb-3 text-primary">{title}</p>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <label
      className={`text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ${className}`}
    >
      {children}
    </label>
  )
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full accent-primary"
      />
    </div>
  )
}

function Toggle({
  on,
  onClick,
  label,
  italic,
}: {
  on: boolean
  onClick: () => void
  label: string
  italic?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-display rounded-[var(--radius-sm)] border px-2 py-1 text-sm font-bold transition-colors ${
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
      }`}
      style={{ fontStyle: italic ? 'italic' : undefined }}
    >
      {label}
    </button>
  )
}

function Quick({ label, onClick, show }: { label: string; onClick: () => void; show: boolean }) {
  if (!show) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
    >
      + {label}
    </button>
  )
}

function ColorRow({
  value,
  onChange,
  palette,
  onEyedrop,
}: {
  value: string
  onChange: (v: string) => void
  palette: string[]
  onEyedrop?: () => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 p-0.5"
        />
        <Input
          value={value.toUpperCase()}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value)
          }}
          className="h-8 flex-1 font-mono text-xs"
        />
        {onEyedrop && (
          <button
            type="button"
            onClick={onEyedrop}
            title="Eyedropper — pick from canvas"
            className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-xs"
          >
            💧
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {palette.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            className="h-5 w-5 rounded-sm border border-border"
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  )
}
