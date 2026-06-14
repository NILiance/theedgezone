'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveCanvasOutput } from '@/app/dashboard/brand-design/actions'

interface TextLayer {
  id: string
  text: string
  font: string
  size: number
  color: string
  weight: number
  x: number
  y: number
}

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

const CANVAS_SIZE = 1024
const FONTS = [
  'Inter',
  'Montserrat',
  'Oswald',
  'Bebas Neue',
  'Playfair Display',
  'Raleway',
  'Poppins',
  'Roboto Slab',
]

const BG_PRESETS = ['#ffffff', '#000000', '#0a0a0a', '#f5f5f5', '#fef3c7', '#dbeafe']

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function LogoCanvas({ brandId, logoUrl, defaults }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [bgColor, setBgColor] = useState(defaults.primary_color || '#ffffff')
  const [bgMode, setBgMode] = useState<'logo' | 'flat'>('logo')
  const [logoScale, setLogoScale] = useState(0.55)
  const [logoOffsetY, setLogoOffsetY] = useState(-50)
  const [layers, setLayers] = useState<TextLayer[]>(() => buildDefaultLayers(defaults))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ ok: boolean; message: string; url?: string } | null>(null)

  // Load the logo as an HTMLImageElement so we can draw it.
  useEffect(() => {
    if (!logoUrl) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setLogoImage(img)
    img.onerror = () => setLogoImage(null)
    img.src = logoUrl
  }, [logoUrl])

  // Re-render whenever inputs change.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Logo
    if (logoImage && bgMode === 'logo') {
      const targetSize = CANVAS_SIZE * logoScale
      const x = (CANVAS_SIZE - targetSize) / 2
      const y = (CANVAS_SIZE - targetSize) / 2 + logoOffsetY
      ctx.drawImage(logoImage, x, y, targetSize, targetSize)
    }

    // Layers
    for (const l of layers) {
      ctx.font = `${l.weight} ${l.size}px ${l.font}, sans-serif`
      ctx.fillStyle = l.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(l.text, l.x, l.y)
    }
  }, [bgColor, bgMode, logoImage, logoScale, logoOffsetY, layers])

  const updateLayer = (id: string, patch: Partial<TextLayer>) =>
    setLayers(layers.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const removeLayer = (id: string) => {
    setLayers(layers.filter((l) => l.id !== id))
    if (selectedId === id) setSelectedId(null)
  }
  const addLayer = () =>
    setLayers([
      ...layers,
      {
        id: uid(),
        text: 'New text',
        font: 'Inter',
        size: 64,
        color: defaults.primary_color || '#000000',
        weight: 700,
        x: CANVAS_SIZE / 2,
        y: CANVAS_SIZE / 2,
      },
    ])

  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = CANVAS_SIZE / rect.width
    const sy = CANVAS_SIZE / rect.height
    const px = (e.clientX - rect.left) * sx
    const py = (e.clientY - rect.top) * sy
    // Find topmost layer whose bounding box contains this point.
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i]!
      const halfW = (l.text.length * l.size) / 3
      const halfH = l.size / 1.5
      if (Math.abs(px - l.x) < halfW && Math.abs(py - l.y) < halfH) {
        setSelectedId(l.id)
        setDraggingId(l.id)
        ;(e.target as Element).setPointerCapture(e.pointerId)
        return
      }
    }
    setSelectedId(null)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = CANVAS_SIZE / rect.width
    const sy = CANVAS_SIZE / rect.height
    const px = (e.clientX - rect.left) * sx
    const py = (e.clientY - rect.top) * sy
    updateLayer(draggingId, { x: Math.max(0, Math.min(CANVAS_SIZE, px)), y: Math.max(0, Math.min(CANVAS_SIZE, py)) })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      ;(e.target as Element).releasePointerCapture(e.pointerId)
      setDraggingId(null)
    }
  }

  const exportAndSave = () => {
    setStatus(null)
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const fd = new FormData()
    fd.set('brand_id', brandId)
    fd.set('data_url', dataUrl)
    fd.set('filename', `logo-overlay-${Date.now()}.png`)
    fd.set(
      'layers_meta',
      JSON.stringify({
        bg_color: bgColor,
        bg_mode: bgMode,
        logo_scale: logoScale,
        logo_offset_y: logoOffsetY,
        layers,
      })
    )
    startTransition(async () => {
      const res = await saveCanvasOutput(fd)
      setStatus({ ok: res.ok, message: res.message ?? (res.ok ? 'Saved.' : 'Failed'), url: res.url })
    })
  }

  const downloadLocal = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `logo-overlay-${Date.now()}.png`
    a.click()
  }

  const selected = layers.find((l) => l.id === selectedId) ?? null

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div ref={containerRef} className="rounded-[var(--radius)] border border-border bg-panel/40 p-3">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block w-full max-w-[640px] cursor-grab touch-none rounded-[var(--radius-sm)] bg-white shadow-elevated"
          style={{ aspectRatio: '1/1' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Drag text on the canvas to position. Selected layer highlights in the sidebar.
        </p>
      </div>

      <aside className="space-y-4">
        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <p className="text-eyebrow mb-3 text-primary">Canvas</p>
          <div className="space-y-2">
            <Label>Background</Label>
            <div className="flex flex-wrap gap-1">
              {BG_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBgColor(c)}
                  className={`h-7 w-7 rounded-sm border ${bgColor === c ? 'border-primary' : 'border-border'}`}
                  style={{ background: c }}
                />
              ))}
              <Input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-7 w-12 p-0.5"
              />
            </div>
            <Label className="mt-3">Logo size</Label>
            <input
              type="range"
              min={0.2}
              max={0.95}
              step={0.01}
              value={logoScale}
              onChange={(e) => setLogoScale(Number(e.target.value))}
              className="block w-full accent-primary"
            />
            <Label className="mt-3">Logo vertical offset</Label>
            <input
              type="range"
              min={-300}
              max={300}
              step={2}
              value={logoOffsetY}
              onChange={(e) => setLogoOffsetY(Number(e.target.value))}
              className="block w-full accent-primary"
            />
          </div>
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-eyebrow text-primary">Text layers</p>
            <Button size="sm" variant="outline" onClick={addLayer}>
              + Add
            </Button>
          </div>
          <ul className="space-y-1">
            {layers.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(l.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-2 py-1.5 text-left text-xs transition-colors ${
                    selectedId === l.id ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <span className="truncate">{l.text || '(empty)'}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeLayer(l.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        removeLayer(l.id)
                      }
                    }}
                    className="text-destructive hover:opacity-70"
                  >
                    ×
                  </span>
                </button>
              </li>
            ))}
            {layers.length === 0 && (
              <li className="rounded-[var(--radius-sm)] border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                No text layers — add one to get started.
              </li>
            )}
          </ul>
        </section>

        {selected && (
          <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
            <p className="text-eyebrow mb-3 text-primary">Edit text</p>
            <div className="space-y-2">
              <div>
                <Label>Text</Label>
                <Input
                  value={selected.text}
                  onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                />
              </div>
              <div>
                <Label>Font</Label>
                <select
                  value={selected.font}
                  onChange={(e) => updateLayer(selected.id, { font: e.target.value })}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
                  style={{ fontFamily: selected.font }}
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Size</Label>
                  <Input
                    type="number"
                    value={selected.size}
                    onChange={(e) => updateLayer(selected.id, { size: Number(e.target.value) })}
                    min={12}
                    max={400}
                  />
                </div>
                <div>
                  <Label>Weight</Label>
                  <select
                    value={selected.weight}
                    onChange={(e) => updateLayer(selected.id, { weight: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
                  >
                    {[400, 500, 600, 700, 800, 900].map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selected.color}
                    onChange={(e) => updateLayer(selected.id, { color: e.target.value })}
                    className="h-10 w-16 p-1"
                  />
                  <Input
                    value={selected.color}
                    onChange={(e) => {
                      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value))
                        updateLayer(selected.id, { color: e.target.value })
                    }}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportAndSave} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save to brand'}
            </Button>
            <Button variant="outline" onClick={downloadLocal}>
              Download PNG
            </Button>
          </div>
          {status && (
            <p
              className={`mt-3 text-xs ${status.ok ? 'text-success' : 'text-destructive'}`}
            >
              {status.message}
              {status.url && (
                <>
                  {' '}
                  <a
                    href={status.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Open
                  </a>
                </>
              )}
            </p>
          )}
        </section>
      </aside>
    </div>
  )
}

function buildDefaultLayers(defaults: Props['defaults']): TextLayer[] {
  const list: TextLayer[] = []
  if (defaults.brand_name) {
    list.push({
      id: uid(),
      text: defaults.brand_name.toUpperCase(),
      font: 'Bebas Neue',
      size: 96,
      color: defaults.primary_color || '#000000',
      weight: 700,
      x: CANVAS_SIZE / 2,
      y: 780,
    })
  }
  if (defaults.jersey_number) {
    list.push({
      id: uid(),
      text: `#${defaults.jersey_number}`,
      font: 'Oswald',
      size: 80,
      color: defaults.primary_color || '#000000',
      weight: 800,
      x: 250,
      y: 250,
    })
  }
  if (defaults.athletic_position) {
    list.push({
      id: uid(),
      text: defaults.athletic_position.toUpperCase(),
      font: 'Inter',
      size: 36,
      color: defaults.secondary_color || '#444444',
      weight: 600,
      x: CANVAS_SIZE / 2,
      y: 870,
    })
  }
  if (defaults.school) {
    list.push({
      id: uid(),
      text: defaults.school.toUpperCase(),
      font: 'Inter',
      size: 28,
      color: defaults.secondary_color || '#666666',
      weight: 600,
      x: CANVAS_SIZE / 2,
      y: 920,
    })
  }
  return list
}
