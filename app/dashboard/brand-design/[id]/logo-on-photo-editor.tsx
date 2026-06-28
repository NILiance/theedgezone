'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateLogoOnPhotoAction, type LogoOnPhotoState } from './logo-on-photo-actions'
import { DownloadLink } from '@/components/download-link'

/**
 * Logo On Your Photo — drag the logo anywhere on the photo + a size slider,
 * then save (server composites at the exact spot) + download. x/y are the logo
 * CENTRE as a 0–1 fraction of the photo; scale is the logo width as a fraction
 * of the photo width — the same math the server uses, so the preview matches.
 */
export function LogoOnPhotoEditor({ brandId, logoUrl }: { brandId: string; logoUrl: string }) {
  const [state, action, pending] = useActionState<LogoOnPhotoState, FormData>(
    generateLogoOnPhotoAction,
    {}
  )
  const router = useRouter()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 })
  const [scale, setScale] = useState(0.25)
  const [watermark, setWatermark] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastUrl = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (state.url && state.url !== lastUrl.current) {
      lastUrl.current = state.url
      router.refresh()
    }
  }, [state.url, router])

  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    },
    [photoUrl]
  )

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(f))
    setPos({ x: 0.5, y: 0.5 })
  }

  function moveTo(clientX: number, clientY: number) {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({
      x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
    })
  }

  if (!logoUrl) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-6 text-center text-sm text-muted-foreground">
        Pick a final logo first — this stamps it onto your photo.
      </div>
    )
  }

  return (
    <form action={action} className="space-y-3 rounded-[var(--radius)] border border-accent/40 bg-panel/40 p-4">
      <input type="hidden" name="brand_id" value={brandId} />
      <input type="hidden" name="x" value={pos.x} />
      <input type="hidden" name="y" value={pos.y} />
      <input type="hidden" name="scale" value={scale} />
      {watermark && <input type="hidden" name="placement" value="watermark" />}

      <label className="block">
        <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Your photo
        </span>
        <input
          type="file"
          name="photo"
          accept="image/png,image/jpeg,image/webp"
          required
          onChange={onPhoto}
          className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-2 file:py-1 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-primary"
        />
      </label>

      {photoUrl ? (
        <>
          <p className="text-center text-[11px] text-muted-foreground">
            Drag the logo anywhere on the photo. Use the slider to resize.
          </p>
          <div
            ref={stageRef}
            onPointerDown={(e) => {
              dragging.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              moveTo(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => dragging.current && moveTo(e.clientX, e.clientY)}
            onPointerUp={() => (dragging.current = false)}
            className="relative mx-auto block max-w-lg cursor-crosshair touch-none select-none overflow-hidden rounded-md border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="" className="block w-full" draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="logo"
              draggable={false}
              style={{
                position: 'absolute',
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                width: `${scale * 100}%`,
                transform: 'translate(-50%, -50%)',
                opacity: watermark ? 0.35 : 1,
                pointerEvents: 'none',
              }}
            />
          </div>

          <label className="block">
            <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Logo size — {Math.round(scale * 100)}%
            </span>
            <input
              type="range"
              min={3}
              max={95}
              value={Math.round(scale * 100)}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="mt-1 w-full"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={watermark}
              onChange={(e) => setWatermark(e.target.checked)}
              className="h-4 w-4"
            />
            Watermark mode (35% opacity)
          </label>
        </>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-background/40 px-3 py-8 text-center text-xs text-muted-foreground">
          Upload a photo to start placing your logo.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="submit"
          disabled={pending || !photoUrl}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save logo placement'}
        </button>
        {state.url && (
          <DownloadLink
            url={state.url}
            className="text-display rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-success"
          >
            ⬇ Download
          </DownloadLink>
        )}
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.url && !pending && (
        <p className="text-[10px] text-success">✓ Saved to Your Creations below.</p>
      )}
    </form>
  )
}
