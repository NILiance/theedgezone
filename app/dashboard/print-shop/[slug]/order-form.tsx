'use client'

import { useActionState, useMemo, useState } from 'react'
import { createPrintOrder, generatePrintProof, type PrintOrderState } from '../actions'
import { AssetPicker } from '@/components/site/editor/asset-picker'

type Variant = { label: string; price_cents: number }
type Option = { key: string; label: string; values: string[]; images?: Record<string, string> }

export function OrderForm({
  productId,
  productName,
  basePriceCents,
  variants,
  options,
  coverUrl,
  brandLogoUrl,
  logoX,
  logoY,
  logoScale,
}: {
  productId: string
  productName: string
  basePriceCents: number
  variants: Variant[]
  options: Option[]
  coverUrl: string
  brandLogoUrl: string
  logoX: number
  logoY: number
  logoScale: number
}) {
  const [state, action, pending] = useActionState<PrintOrderState, FormData>(createPrintOrder, {})
  const [variant, setVariant] = useState<string>(variants[0]?.label ?? '')
  const [quantity, setQuantity] = useState<number>(1)
  const [artwork, setArtwork] = useState('')

  // Live color preview — the color option carries a per-color product photo map.
  const colorOption = useMemo(() => options.find((o) => o.key === 'color'), [options])
  const [selectedColor, setSelectedColor] = useState(colorOption?.values[0] ?? '')
  const previewImage = (selectedColor && colorOption?.images?.[selectedColor]) || coverUrl

  // Proof generator
  const [logoUrl, setLogoUrl] = useState(brandLogoUrl)
  const [knockout, setKnockout] = useState(true)
  const [proofBusy, setProofBusy] = useState(false)
  const [proofErr, setProofErr] = useState<string | null>(null)
  const [proof, setProof] = useState<string | null>(null)

  const runProof = async () => {
    setProofErr(null)
    setProof(null)
    if (!previewImage) {
      setProofErr('This product has no image to print on.')
      return
    }
    if (!logoUrl) {
      setProofErr('Add a logo to place.')
      return
    }
    setProofBusy(true)
    try {
      const res = await generatePrintProof({
        blank_url: previewImage,
        logo_url: logoUrl,
        placement: 'center',
        size_pct: Math.round(logoScale * 100),
        knockout_white: knockout,
        logo_x: logoX,
        logo_y: logoY,
      })
      if (res.ok && res.url) setProof(res.url)
      else setProofErr(res.message ?? 'Proof failed')
    } catch (err) {
      setProofErr(err instanceof Error ? err.message : 'Proof failed')
    } finally {
      setProofBusy(false)
    }
  }
  const addProofToArtwork = (url: string) => {
    setArtwork((a) => (a.trim() ? `${a.trim()}\n${url}` : url))
    setProof(null)
  }

  const unitPrice = useMemo(() => {
    const v = variants.find((x) => x.label === variant)
    return v ? v.price_cents : basePriceCents
  }, [variant, variants, basePriceCents])
  const total = unitPrice * Math.max(1, quantity)

  if (state.checkoutUrl) {
    if (typeof window !== 'undefined') {
      window.location.href = state.checkoutUrl
    }
    return (
      <p className="rounded-[var(--radius)] border border-border bg-panel/40 p-6 text-sm">
        Redirecting to checkout…
      </p>
    )
  }

  return (
    <form action={action} className="space-y-5 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <input type="hidden" name="product_id" value={productId} />
      <p className="text-eyebrow text-primary">Order {productName}</p>

      {/* Live preview — product photo (swaps by color) with the logo overlaid at
          the admin's per-product placement. Uses the image's NATURAL aspect
          ratio (block w-full, no crop) so logo_x/y map to the exact same spot
          the admin set in the placer. */}
      {previewImage && (
        <div className="mx-auto w-full max-w-xs">
          <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-panel-elevated">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="" className="block w-full" />
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="pointer-events-none absolute object-contain"
                style={{
                  left: `${logoX * 100}%`,
                  top: `${logoY * 100}%`,
                  width: `${logoScale * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
          </div>
          {colorOption && selectedColor && (
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              {selectedColor} · live preview
            </p>
          )}
        </div>
      )}

      {variants.length > 0 && (
        <label className="block text-sm">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Variant</span>
          <select
            name="variant_label"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
          >
            {variants.map((v) => (
              <option key={v.label} value={v.label}>
                {v.label} — ${(v.price_cents / 100).toFixed(0)}
              </option>
            ))}
          </select>
        </label>
      )}

      {options.map((opt) => {
        const isColor = opt.key === 'color'
        return (
          <label key={opt.key} className="block text-sm">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{opt.label}</span>
            <select
              name={`opt_${opt.key}`}
              value={isColor ? selectedColor : undefined}
              defaultValue={isColor ? undefined : opt.values[0] ?? ''}
              onChange={isColor ? (e) => setSelectedColor(e.target.value) : undefined}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            >
              {opt.values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        )
      })}

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Quantity</span>
        <input
          name="quantity"
          type="number"
          min={1}
          max={50}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
        />
      </label>

      {/* Proof generator */}
      <div className="rounded-[var(--radius)] border border-border bg-panel/30 p-3">
        <p className="text-display text-xs font-bold uppercase tracking-widest text-accent">
          Generate a proof
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Preview your logo on this product — it&rsquo;s placed at the position + size set for this
          product. Then add the proof to your artwork.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <span className="block text-[11px] text-muted-foreground">Logo</span>
            <div className="mt-1">
              <AssetPicker
                value={logoUrl}
                onChange={setLogoUrl}
                accept="image/*"
                allowGenerate={false}
              />
            </div>
          </div>
          <div className="flex items-start">
            <label className="flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={knockout}
                onChange={(e) => setKnockout(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Remove white background from the logo
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runProof}
            disabled={proofBusy}
            className="text-display rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-panel disabled:opacity-50"
          >
            {proofBusy ? 'Rendering…' : 'Generate proof'}
          </button>
          {proofErr && <span className="text-[11px] text-destructive">{proofErr}</span>}
        </div>
        {proof && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proof}
              alt="Proof"
              className="h-36 w-36 rounded-[var(--radius-sm)] border border-border object-contain"
            />
            <button
              type="button"
              onClick={() => addProofToArtwork(proof)}
              className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
            >
              Add to artwork
            </button>
          </div>
        )}
      </div>

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Artwork URLs (one per line)
        </span>
        <textarea
          name="artwork_urls"
          rows={3}
          value={artwork}
          onChange={(e) => setArtwork(e.target.value)}
          placeholder="https://… (PDF, PNG, AI, EPS) — or generate a proof above"
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-xs uppercase tracking-widest text-muted-foreground">Ship to</legend>
        <input
          name="ship_to_name"
          required
          placeholder="Full name"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="ship_to_phone"
          placeholder="Phone"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="ship_to_street"
          required
          placeholder="Street address"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-[1fr_120px_120px] gap-2">
          <input
            name="ship_to_city"
            required
            placeholder="City"
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            name="ship_to_state"
            required
            placeholder="State"
            maxLength={2}
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm uppercase"
          />
          <input
            name="ship_to_postal"
            required
            placeholder="ZIP"
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Notes</span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Anything we should know — color match, delivery date, etc."
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-baseline justify-between rounded-[var(--radius-sm)] border border-border bg-background/40 px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Total</p>
        <p className="text-display text-2xl font-black text-primary">
          ${(total / 100).toFixed(2)}
        </p>
      </div>

      {state.error && (
        <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="text-display w-full rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Setting up checkout…' : 'Continue to checkout →'}
      </button>
    </form>
  )
}
