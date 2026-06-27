'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { updateAppStoreListing } from '../actions'
import { STORE_LISTING_SECTIONS, listingCompleteness, type ListingField } from '@/lib/app-store-listing'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

/** Store submission tab — everything Apple/Google ask for at launch. */
export function SubmissionTab({ appId, storeListing }: { appId: string; storeListing: Record<string, unknown> }) {
  const [listing, setListing] = useState<Record<string, unknown>>(() => clone(storeListing ?? {}))
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const { done, total, pct } = listingCompleteness(listing)

  const setField = (key: string, value: unknown) => setListing((l) => ({ ...l, [key]: value }))
  const save = () => {
    setStatus(null)
    const fd = new FormData()
    fd.set('app_id', appId)
    fd.set('store_listing', JSON.stringify(listing))
    startTransition(async () => {
      const res = await updateAppStoreListing(fd)
      setStatus(res.ok ? 'Saved.' : res.message ?? 'Save failed')
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Required fields complete</p>
          <p className="text-display text-sm font-black text-primary">{done}/{total} · {pct}%</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel-elevated">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Everything Apple App Store Connect + Google Play ask for at submission. Fill it here so launch is copy-paste.
        </p>
      </div>

      {STORE_LISTING_SECTIONS.map((sec) => (
        <section key={sec.title} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <p className="text-eyebrow text-primary">{sec.title}</p>
          {sec.description && <p className="mt-1 text-xs text-muted-foreground">{sec.description}</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sec.fields.map((f) => (
              <ListingFieldInput key={f.key} field={f} value={listing[f.key]} onChange={(v) => setField(f.key, v)} />
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button onClick={save} disabled={isPending}>{isPending ? 'Saving…' : 'Save submission'}</Button>
        {status && <p className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}>{status}</p>}
      </div>
    </div>
  )
}

function ListingFieldInput({ field, value, onChange }: { field: ListingField; value: unknown; onChange: (v: unknown) => void }) {
  const inputCls = 'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'
  const wrap = field.kind === 'textarea' || field.kind === 'images' ? 'sm:col-span-2' : ''
  const label = (
    <span className="block text-xs text-muted-foreground">
      {field.label}
      {field.required && <span className="text-accent"> *</span>}
      {field.maxLength && <span className="text-muted-foreground/60"> ({field.maxLength})</span>}
    </span>
  )

  if (field.kind === 'checkbox') {
    return (
      <label className={`flex items-center gap-2 text-sm ${wrap}`}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
        {field.label}
      </label>
    )
  }
  if (field.kind === 'select') {
    return (
      <label className={`block text-sm ${wrap}`}>
        {label}
        <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>{o || '—'}</option>
          ))}
        </select>
      </label>
    )
  }
  if (field.kind === 'textarea') {
    return (
      <label className={`block text-sm ${wrap}`}>
        {label}
        <textarea rows={4} maxLength={field.maxLength} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      </label>
    )
  }
  if (field.kind === 'image') {
    return (
      <div className={`text-sm ${wrap}`}>
        {label}
        <div className="mt-1"><AssetPicker value={(value as string) ?? ''} onChange={onChange} accept="image/*" /></div>
      </div>
    )
  }
  if (field.kind === 'images') {
    const imgs = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className={`text-sm ${wrap}`}>
        {label}
        <div className="mt-1 space-y-2">
          {imgs.map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1"><AssetPicker value={img} onChange={(v) => onChange(imgs.map((x, idx) => (idx === i ? v : x)))} accept="image/*" /></div>
              <button type="button" onClick={() => onChange(imgs.filter((_, idx) => idx !== i))} className="text-destructive">✕</button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => onChange([...imgs, ''])}>+ Add image</Button>
        </div>
      </div>
    )
  }
  return (
    <label className={`block text-sm ${wrap}`}>
      {label}
      <input type={field.kind === 'url' ? 'url' : 'text'} maxLength={field.maxLength} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={`${inputCls}${field.kind === 'url' ? ' font-mono text-xs' : ''}`} />
    </label>
  )
}
