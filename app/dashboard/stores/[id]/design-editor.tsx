'use client'

import { useState, useTransition } from 'react'
import { saveStoreDesign } from '../actions'
import {
  STORE_SECTION_KINDS,
  STORE_FONTS,
  type StoreSection,
  type StoreSectionType,
  type StoreTheme,
} from '@/lib/store-sections'

interface ProductLite {
  id: string
  name: string
  primary_image_url: string | null
}

const inputCls =
  'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'

export function StoreDesignEditor({
  storeId,
  theme: theme0,
  sections: sections0,
  products,
}: {
  storeId: string
  theme: Partial<StoreTheme>
  sections: StoreSection[]
  products: ProductLite[]
}) {
  const [theme, setTheme] = useState<StoreTheme>({
    heading_font: theme0?.heading_font ?? 'system',
    body_font: theme0?.body_font ?? 'system',
  })
  const [sections, setSections] = useState<StoreSection[]>(sections0 ?? [])
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const update = (id: string, patch: Partial<StoreSection>) =>
    setSections((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const move = (id: string, dir: -1 | 1) =>
    setSections((arr) => {
      const i = arr.findIndex((s) => s.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return arr
      const copy = [...arr]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  const remove = (id: string) => setSections((arr) => arr.filter((s) => s.id !== id))
  const add = (type: StoreSectionType) =>
    setSections((arr) => [
      ...arr,
      { id: Math.random().toString(36).slice(2), type, align: 'center' },
    ])

  const save = () => {
    setMsg(null)
    startTransition(async () => {
      const res = await saveStoreDesign({ store_id: storeId, theme, sections })
      setMsg({ ok: res.ok, text: res.ok ? 'Design saved ✓' : res.error ?? 'Save failed' })
    })
  }

  return (
    <div className="space-y-5 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Storefront design</p>
          <h3 className="text-display text-lg font-black">Content &amp; sections</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Build your storefront like a website — add, reorder, and style sections. Your catalog
            grid shows automatically unless you place a Product grid or Featured section.
          </p>
        </div>
        <button
          onClick={save}
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save design'}
        </button>
      </div>
      {msg && (
        <p className={`text-xs ${msg.ok ? 'text-success' : 'text-destructive'}`}>{msg.text}</p>
      )}

      {/* Theme */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Heading font</span>
          <select
            value={theme.heading_font}
            onChange={(e) => setTheme((t) => ({ ...t, heading_font: e.target.value }))}
            className={inputCls}
          >
            {STORE_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Body font</span>
          <select
            value={theme.body_font}
            onChange={(e) => setTheme((t) => ({ ...t, body_font: e.target.value }))}
            className={inputCls}
          >
            {STORE_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((s, i) => (
          <SectionEditor
            key={s.id}
            s={s}
            products={products}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            onChange={(patch) => update(s.id, patch)}
            onMove={(dir) => move(s.id, dir)}
            onRemove={() => remove(s.id)}
          />
        ))}
        {sections.length === 0 && (
          <p className="rounded-[var(--radius-sm)] border border-dashed border-border bg-background/30 p-4 text-center text-xs text-muted-foreground">
            No custom sections yet — your product catalog shows by default. Add sections below.
          </p>
        )}
      </div>

      {/* Add */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Add section:</span>
        {STORE_SECTION_KINDS.map((k) => (
          <button
            key={k.type}
            type="button"
            onClick={() => add(k.type)}
            title={k.hint}
            className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest hover:border-primary hover:text-primary"
          >
            + {k.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SectionEditor({
  s,
  products,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: {
  s: StoreSection
  products: ProductLite[]
  isFirst: boolean
  isLast: boolean
  onChange: (patch: Partial<StoreSection>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}) {
  const kind = STORE_SECTION_KINDS.find((k) => k.type === s.type)
  const arrowCls =
    'rounded border border-border px-2 py-1 text-xs disabled:opacity-30 hover:bg-panel-elevated'
  return (
    <div className="space-y-2 rounded-[var(--radius-sm)] border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-display text-xs font-bold uppercase tracking-widest text-accent">
          {kind?.label ?? s.type}
        </p>
        <div className="flex gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={isFirst} className={arrowCls}>
            ↑
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={isLast} className={arrowCls}>
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
          >
            ✕
          </button>
        </div>
      </div>

      {s.type !== 'custom_html' && (
        <input
          value={s.heading ?? ''}
          onChange={(e) => onChange({ heading: e.target.value })}
          placeholder="Heading (optional)"
          className={inputCls}
        />
      )}

      {s.type === 'about' && (
        <textarea
          value={s.body ?? ''}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Body text — your story, shipping policy, etc."
          rows={3}
          className={inputCls}
        />
      )}

      {s.type === 'featured' && (
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {products.length === 0 && (
            <p className="col-span-full text-xs text-muted-foreground">Add products first.</p>
          )}
          {products.map((p) => {
            const on = (s.product_ids ?? []).includes(p.id)
            return (
              <label key={p.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => {
                    const set = new Set(s.product_ids ?? [])
                    if (e.target.checked) set.add(p.id)
                    else set.delete(p.id)
                    onChange({ product_ids: [...set] })
                  }}
                  className="h-3.5 w-3.5"
                />
                <span className="truncate">{p.name}</span>
              </label>
            )
          })}
        </div>
      )}

      {s.type === 'gallery' && (
        <textarea
          value={(s.images ?? []).join('\n')}
          onChange={(e) =>
            onChange({ images: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })
          }
          placeholder="One image URL per line"
          rows={3}
          className={`${inputCls} font-mono text-xs`}
        />
      )}

      {s.type === 'banner' && (
        <>
          <textarea
            value={s.body ?? ''}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder="Subtext"
            rows={2}
            className={inputCls}
          />
          <input
            value={s.image_url ?? ''}
            onChange={(e) => onChange({ image_url: e.target.value })}
            placeholder="Background image URL (optional)"
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={s.cta_text ?? ''}
              onChange={(e) => onChange({ cta_text: e.target.value })}
              placeholder="Button text"
              className={inputCls}
            />
            <input
              value={s.cta_url ?? ''}
              onChange={(e) => onChange({ cta_url: e.target.value })}
              placeholder="Button URL"
              className={inputCls}
            />
          </div>
        </>
      )}

      {s.type === 'testimonials' && (
        <textarea
          value={(s.quotes ?? []).map((q) => (q.author ? `${q.text} | ${q.author}` : q.text)).join('\n')}
          onChange={(e) =>
            onChange({
              quotes: e.target.value
                .split('\n')
                .map((l) => {
                  const [text, author] = l.split('|').map((x) => x.trim())
                  return { text: text ?? '', author: author || undefined }
                })
                .filter((q) => q.text),
            })
          }
          placeholder="One per line:  Great gear! | Jordan B."
          rows={3}
          className={inputCls}
        />
      )}

      {s.type === 'custom_html' && (
        <textarea
          value={s.html ?? ''}
          onChange={(e) => onChange({ html: e.target.value })}
          placeholder="<div>…your HTML…</div>"
          rows={4}
          className={`${inputCls} font-mono text-xs`}
        />
      )}

      {s.type !== 'custom_html' && (
        <div className="grid grid-cols-2 gap-2">
          <select
            value={s.align ?? 'center'}
            onChange={(e) => onChange({ align: e.target.value as StoreSection['align'] })}
            className={inputCls}
          >
            <option value="left">Align left</option>
            <option value="center">Align center</option>
            <option value="right">Align right</option>
          </select>
          <input
            value={s.bg ?? ''}
            onChange={(e) => onChange({ bg: e.target.value })}
            placeholder="Background (e.g. #ffffff)"
            className={inputCls}
          />
        </div>
      )}
    </div>
  )
}
