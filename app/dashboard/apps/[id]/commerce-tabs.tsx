'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import type { AppScreen } from '@/lib/app-screens'
import { screenEmoji } from '@/lib/app-screens'
import type { AppCommerce, AppProduct, AppTier } from '@/lib/app-commerce'
import { EditorShell } from './editor-shell'

const inputCls = 'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2.5 py-1.5 text-sm'
const genId = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`

/* ─────────────────────────── Shop ─────────────────────────── */

export function ShopTab({
  commerce,
  onChange,
  onEditing,
  onSave,
}: {
  commerce: AppCommerce
  onChange: (c: AppCommerce) => void
  onEditing: (b: boolean) => void
  onSave: () => void
}) {
  const products = commerce.products
  const [editing, setEditing] = useState<number | null>(null)
  const setProducts = (next: AppProduct[]) => onChange({ ...commerce, products: next })
  const open = (i: number) => { setEditing(i); onEditing(true) }
  const close = () => { setEditing(null); onEditing(false) }

  const add = () => {
    setProducts([...products, { id: genId('prod'), name: '', description: '', price: '', category: '', image: '', inventory: '', active: true, variants: [] }])
    open(products.length)
  }
  const patch = (i: number, p: Partial<AppProduct>) => setProducts(products.map((x, idx) => (idx === i ? { ...x, ...p } : x)))

  if (editing !== null && products[editing]) {
    const p = products[editing]!
    return (
      <EditorShell title={p.name ? 'Edit Product' : 'New Product'} backLabel="← Back to Products" saveLabel="Save Product" onBack={close} onSave={() => { onSave(); close() }}>
        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <p className="text-display mb-2 font-bold">Product Details</p>
          <Field label="Name"><input value={p.name} onChange={(e) => patch(editing, { name: e.target.value })} placeholder="Product name" className={inputCls} /></Field>
          <Field label="Description"><textarea rows={3} value={p.description} onChange={(e) => patch(editing, { description: e.target.value })} placeholder="Product description…" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price ($)"><input type="number" step="0.01" value={p.price} onChange={(e) => patch(editing, { price: e.target.value })} placeholder="19.99" className={inputCls} /></Field>
            <Field label="Category"><input value={p.category} onChange={(e) => patch(editing, { category: e.target.value })} placeholder="Apparel, Accessories…" className={inputCls} /></Field>
          </div>
          <Field label="Image"><AssetPicker value={p.image} onChange={(v) => patch(editing, { image: v })} accept="image/*" /></Field>
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Inventory"><input type="number" value={p.inventory} onChange={(e) => patch(editing, { inventory: e.target.value })} placeholder="Leave blank for unlimited" className={inputCls} /></Field>
            <label className="flex items-center gap-2 pb-1.5 text-sm">
              <input type="checkbox" checked={p.active} onChange={(e) => patch(editing, { active: e.target.checked })} className="h-4 w-4 accent-primary" /> Active
            </label>
          </div>
        </section>
        <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <p className="text-display mb-2 font-bold">Variants</p>
          <VariantRows variants={p.variants} onChange={(v) => patch(editing, { variants: v })} />
        </section>
      </EditorShell>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-display text-2xl font-black">Products</h2>
        <Button size="sm" onClick={add}>+ Add Product</Button>
      </div>
      {products.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-10 text-center text-sm text-muted-foreground">
          No products yet. Add your first product to get started.
        </div>
      ) : (
        products.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-3">
            {p.image ? <img src={p.image} alt="" className="h-10 w-10 rounded-[var(--radius-sm)] object-cover" /> : <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-panel-elevated" />}
            <div className="min-w-0 flex-1">
              <p className="text-display truncate font-bold">{p.name || 'Untitled'}</p>
              <p className="text-[11px] text-muted-foreground">${p.price || '0'}{p.category ? ` · ${p.category}` : ''}{p.active ? '' : ' · hidden'}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => open(i)}>Edit</Button>
            <button type="button" onClick={() => setProducts(products.filter((_, idx) => idx !== i))} className="text-display px-2 text-xs font-bold uppercase tracking-widest text-destructive">Delete</button>
          </div>
        ))
      )}
    </div>
  )
}

function VariantRows({ variants, onChange }: { variants: AppProduct['variants']; onChange: (v: AppProduct['variants']) => void }) {
  return (
    <div className="space-y-2">
      {variants.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={v.name} onChange={(e) => onChange(variants.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} placeholder="Size, Color…" className={`${inputCls} flex-1`} />
          <input value={v.value} onChange={(e) => onChange(variants.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))} placeholder="XL, Red…" className={`${inputCls} flex-1`} />
          <input value={v.price_adj} onChange={(e) => onChange(variants.map((x, idx) => (idx === i ? { ...x, price_adj: e.target.value } : x)))} placeholder="+/- $" className={`${inputCls} w-20`} />
          <button type="button" onClick={() => onChange(variants.filter((_, idx) => idx !== i))} className="text-destructive">✕</button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...variants, { name: '', value: '', price_adj: '' }])}>+ Add Variant</Button>
    </div>
  )
}

/* ─────────────────────────── Fans (form) ─────────────────────────── */

export function FansTab({ commerce, onChange, screens }: { commerce: AppCommerce; onChange: (c: AppCommerce) => void; screens: AppScreen[] }) {
  const tiers = commerce.subscription_tiers
  const setTiers = (next: AppTier[]) => onChange({ ...commerce, subscription_tiers: next })
  const patchTier = (i: number, p: Partial<AppTier>) => setTiers(tiers.map((x, idx) => (idx === i ? { ...x, ...p } : x)))
  const toggleGated = (i: number, type: string) => {
    const t = tiers[i]!
    const gated = t.gated_screens.includes(type) ? t.gated_screens.filter((x) => x !== type) : [...t.gated_screens, type]
    patchTier(i, { gated_screens: gated })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-display font-bold">Subscription Tiers</p>
          <Button size="sm" variant="outline" onClick={() => setTiers([...tiers, { id: genId('tier'), name: '', price: '', perks: '', gated_screens: [], nav_button: '' }])}>+ Add Tier</Button>
        </div>
        <div className="mt-3 space-y-3">
          {tiers.map((t, i) => (
            <div key={t.id} className="rounded-[var(--radius-sm)] border border-border bg-panel/30 p-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Tier name"><input value={t.name} onChange={(e) => patchTier(i, { name: e.target.value })} className={inputCls} /></Field>
                <Field label="Price ($/mo)"><input type="number" step="0.01" value={t.price} onChange={(e) => patchTier(i, { price: e.target.value })} className={inputCls} /></Field>
              </div>
              <Field label="Perks (one per line)"><textarea rows={3} value={t.perks} onChange={(e) => patchTier(i, { perks: e.target.value })} className={inputCls} /></Field>
              <span className="mb-1 block text-xs text-muted-foreground">Screens unlocked by this tier</span>
              <div className="flex flex-wrap gap-1.5">
                {screens.map((s) => (
                  <label key={s.id} className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-[11px]">
                    <input type="checkbox" checked={t.gated_screens.includes(s.type)} onChange={() => toggleGated(i, s.type)} className="h-3 w-3 accent-primary" />
                    {screenEmoji(s.icon)} {s.title}
                  </label>
                ))}
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <Field label="Nav button">
                  <select value={t.nav_button} onChange={(e) => patchTier(i, { nav_button: e.target.value as AppTier['nav_button'] })} className={inputCls}>
                    <option value="">No nav button</option>
                    <option value="show">Show &quot;Subscribe&quot; button</option>
                    <option value="badge">Lock badge on gated screens</option>
                  </select>
                </Field>
                <button type="button" onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))} className="pb-1.5 text-xs text-destructive">Remove tier</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-display font-bold">Tip Jar</p>
        <div className="mt-2 space-y-2">
          <Field label="Preset amounts (comma-separated)"><input value={commerce.tip_jar.presets} onChange={(e) => onChange({ ...commerce, tip_jar: { ...commerce.tip_jar, presets: e.target.value } })} className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={commerce.tip_jar.custom_amount} onChange={(e) => onChange({ ...commerce, tip_jar: { ...commerce.tip_jar, custom_amount: e.target.checked } })} className="h-4 w-4 accent-primary" /> Allow custom amount
          </label>
          <Field label="Thank-you message"><textarea rows={2} value={commerce.tip_jar.message} onChange={(e) => onChange({ ...commerce, tip_jar: { ...commerce.tip_jar, message: e.target.value } })} className={inputCls} /></Field>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-display font-bold">Fan Wall</p>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={commerce.fan_wall.moderation} onChange={(e) => onChange({ ...commerce, fan_wall: { ...commerce.fan_wall, moderation: e.target.checked } })} className="h-4 w-4 accent-primary" /> Enable moderation (approve before posting)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={commerce.fan_wall.require_login} onChange={(e) => onChange({ ...commerce, fan_wall: { ...commerce.fan_wall, require_login: e.target.checked } })} className="h-4 w-4 accent-primary" /> Require login to post
          </label>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
