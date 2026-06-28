'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateQrCodeAction, type QrActionState } from './arsenal-tab-actions'
import { QR_TYPE_OPTIONS } from '@/lib/arsenal-tab-options'
import { DownloadLink } from '@/components/download-link'

export function QrCodeTab({
  brandId,
  hasFinal,
  brandPrimary,
  brandSecondary,
}: {
  brandId: string
  hasFinal: boolean
  brandPrimary: string | null
  brandSecondary: string | null
}) {
  const [state, action, pending] = useActionState<QrActionState, FormData>(
    generateQrCodeAction,
    {}
  )
  const [qrType, setQrType] = useState<string>(QR_TYPE_OPTIONS[0]!.value)
  const [qrColor, setQrColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const placeholder = QR_TYPE_OPTIONS.find((t) => t.value === qrType)?.placeholder ?? ''
  useRefreshOnNewUrl(state.url)

  if (!hasFinal) return <LockedNotice label="QR Code" />

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Branded QR Code</h2>
      <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground">
        Generate scannable QR codes with your logo centered. Choose the type, customize colors,
        and download for business cards, posters, or social media.
      </p>

      <form action={action} className="mx-auto mt-6 grid max-w-3xl gap-4">
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="qr_color" value={qrColor} />
        <input type="hidden" name="bg_color" value={bgColor} />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              QR type
            </span>
            <select
              value={qrType}
              onChange={(e) => setQrType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {QR_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Colors
            </span>
            <div className="mt-1 flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
              <ColorSwatch label="QR" value={qrColor} onChange={setQrColor} />
              <ColorSwatch label="BG" value={bgColor} onChange={setBgColor} />
              {brandPrimary && (
                <button
                  type="button"
                  onClick={() => setQrColor(brandPrimary)}
                  aria-label="Use brand primary"
                  className="h-8 w-8 rounded border border-border"
                  style={{ background: brandPrimary }}
                />
              )}
              {brandSecondary && (
                <button
                  type="button"
                  onClick={() => setQrColor(brandSecondary)}
                  aria-label="Use brand secondary"
                  className="h-8 w-8 rounded border border-border"
                  style={{ background: brandSecondary }}
                />
              )}
            </div>
          </div>
        </div>
        <input
          type="text"
          name="target"
          placeholder={placeholder}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" name="include_logo" value="1" defaultChecked className="h-4 w-4" />
          Center logo on QR
        </label>
        <div className="mt-2 flex justify-center">
          <button
            type="submit"
            disabled={pending}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Generating…' : 'Generate QR Code'}
          </button>
        </div>
      </form>

      {state.url && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-[var(--radius)] border border-success/40 bg-success/5 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.url}
            alt="QR code"
            className="h-64 w-64 rounded-md border border-border bg-white object-contain"
          />
          <DownloadLink
            url={state.url}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            ⬇ Download PNG
          </DownloadLink>
        </div>
      )}
      {state.error && <p className="mt-4 text-center text-xs text-destructive">{state.error}</p>}
    </div>
  )
}

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-1">
      <span className="text-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-12 cursor-pointer rounded border border-border bg-background"
      />
    </label>
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
