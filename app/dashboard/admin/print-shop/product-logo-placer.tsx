'use client'

import { useRef, useState } from 'react'

/**
 * Admin tool: drag a "LOGO" box onto a product cover to set where each talent's
 * logo will overlay. Outputs x/y (centre, 0–1) + scale (width, 0–1) to hidden
 * inputs the product form submits.
 */
export function ProductLogoPlacer({
  coverUrl,
  x0,
  y0,
  s0,
}: {
  coverUrl: string
  x0: number
  y0: number
  s0: number
}) {
  const [pos, setPos] = useState({ x: x0, y: y0 })
  const [scale, setScale] = useState(s0)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

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
      <input type="hidden" name="logo_x" value={pos.x} />
      <input type="hidden" name="logo_y" value={pos.y} />
      <input type="hidden" name="logo_scale" value={scale} />
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Logo placement
      </span>
      <div
        ref={stageRef}
        className="relative mx-auto mt-1 max-w-[240px] cursor-move select-none overflow-hidden rounded-md border border-border"
        onPointerMove={(e) => {
          if (dragging.current) moveTo(e.clientX, e.clientY)
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => (dragging.current = false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt="" className="block w-full" draggable={false} />
        <div
          onPointerDown={(e) => {
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            moveTo(e.clientX, e.clientY)
          }}
          className="absolute flex items-center justify-center rounded border-2 border-dashed border-primary bg-primary/25 text-[8px] font-bold uppercase tracking-widest text-primary"
          style={{
            left: `${pos.x * 100}%`,
            top: `${pos.y * 100}%`,
            width: `${scale * 100}%`,
            aspectRatio: '1',
            transform: 'translate(-50%, -50%)',
          }}
        >
          Logo
        </div>
      </div>
      <label className="mt-2 block">
        <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Logo size · {Math.round(scale * 100)}%
        </span>
        <input
          type="range"
          min={0.05}
          max={0.8}
          step={0.01}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="mt-1 w-full max-w-[240px] cursor-pointer"
        />
      </label>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Drag the box to where the talent&rsquo;s logo should sit on this product.
      </p>
    </div>
  )
}
