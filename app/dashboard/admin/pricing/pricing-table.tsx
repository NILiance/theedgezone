'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { upsertServicePricing } from './actions'

interface Row {
  service_slug: string
  title: string
  category: string
  audience: string
  defaultLabel: string
  plan_monthly_cents: number | null
  plan_annual_cents: number | null
  plan_onetime_cents: number | null
  custom_label: string | null
  active: boolean
  hasOverride: boolean
  revision_price_cents: number | null
  first_revision_free: boolean
  additional_brand_price_cents: number | null
}

interface Props {
  rows: Row[]
  categoriesByKey: Record<string, string>
}

export function PricingTable({ rows, categoriesByKey }: Props) {
  const [filter, setFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const categories = Array.from(new Set(rows.map((r) => r.category)))
  const filtered = rows.filter((r) => {
    if (categoryFilter && r.category !== categoryFilter) return false
    if (filter) {
      const q = filter.toLowerCase()
      if (
        !r.title.toLowerCase().includes(q) &&
        !r.service_slug.toLowerCase().includes(q)
      ) {
        return false
      }
    }
    return true
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by title or slug"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="min-w-[240px] max-w-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoriesByKey[c] ?? c}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/30">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Service</th>
              <th className="px-3 py-2 text-right">Monthly ($)</th>
              <th className="px-3 py-2 text-right">Annual ($)</th>
              <th className="px-3 py-2 text-right">One-time ($)</th>
              <th className="px-3 py-2 text-left">Custom label</th>
              <th className="px-3 py-2 text-center">Active</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <PriceRow key={row.service_slug} initial={row} categoriesByKey={categoriesByKey} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function centsToDollars(c: number | null): string {
  if (c == null) return ''
  return (c / 100).toString()
}

function PriceRow({
  initial,
  categoriesByKey,
}: {
  initial: Row
  categoriesByKey: Record<string, string>
}) {
  const [monthly, setMonthly] = useState<string>(centsToDollars(initial.plan_monthly_cents))
  const [annual, setAnnual] = useState<string>(centsToDollars(initial.plan_annual_cents))
  const [onetime, setOnetime] = useState<string>(centsToDollars(initial.plan_onetime_cents))
  const [custom, setCustom] = useState<string>(initial.custom_label ?? '')
  const [active, setActive] = useState<boolean>(initial.active)
  // Brand-design-only extras
  const [revisionPrice, setRevisionPrice] = useState<string>(
    centsToDollars(initial.revision_price_cents)
  )
  const [firstFree, setFirstFree] = useState<boolean>(initial.first_revision_free)
  const [additionalPrice, setAdditionalPrice] = useState<string>(
    centsToDollars(initial.additional_brand_price_cents)
  )
  const [extrasOpen, setExtrasOpen] = useState<boolean>(false)
  const [status, setStatus] = useState<'idle' | 'saved' | string>('idle')
  const [isPending, startTransition] = useTransition()

  const hasExtras = initial.service_slug === 'personal-brand-design'

  const save = () => {
    setStatus('idle')
    const fd = new FormData()
    fd.set('service_slug', initial.service_slug)
    fd.set('plan_monthly_cents', monthly === '' ? '' : String(Math.round(Number(monthly) * 100)))
    fd.set('plan_annual_cents', annual === '' ? '' : String(Math.round(Number(annual) * 100)))
    fd.set('plan_onetime_cents', onetime === '' ? '' : String(Math.round(Number(onetime) * 100)))
    if (custom.trim()) fd.set('custom_label', custom.trim())
    fd.set('active', active ? 'on' : 'false')
    if (hasExtras) {
      fd.set(
        'revision_price_cents',
        revisionPrice === '' ? '' : String(Math.round(Number(revisionPrice) * 100))
      )
      fd.set('first_revision_free', firstFree ? 'on' : 'false')
      fd.set(
        'additional_brand_price_cents',
        additionalPrice === '' ? '' : String(Math.round(Number(additionalPrice) * 100))
      )
    }
    startTransition(async () => {
      const res = await upsertServicePricing(fd)
      setStatus(res.ok ? 'saved' : res.message ?? 'Failed')
    })
  }

  return (
    <>
      <tr className="border-t border-border">
        <td className="px-3 py-2">
          <p className="text-display font-bold text-foreground">{initial.title}</p>
          <p className="text-[10px] text-muted-foreground">
            <code>{initial.service_slug}</code> ·{' '}
            {categoriesByKey[initial.category] ?? initial.category} · {initial.audience}
            {!initial.hasOverride && ' · using default'}
          </p>
          {hasExtras && (
            <button
              type="button"
              onClick={() => setExtrasOpen((v) => !v)}
              className="text-display mt-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              {extrasOpen ? '− Hide extras' : '+ Revisions & additional logos'}
            </button>
          )}
        </td>
        <td className="px-2 py-2">
          <Input
            inputMode="decimal"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder="—"
            className="h-8 w-24 text-right text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <Input
            inputMode="decimal"
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
            placeholder="—"
            className="h-8 w-24 text-right text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <Input
            inputMode="decimal"
            value={onetime}
            onChange={(e) => setOnetime(e.target.value)}
            placeholder="—"
            className="h-8 w-24 text-right text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={initial.defaultLabel}
            className="h-8 w-40 text-xs"
          />
        </td>
        <td className="px-2 py-2 text-center">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </td>
        <td className="px-2 py-2 text-right">
          <Button size="sm" onClick={save} disabled={isPending}>
            {isPending ? '…' : 'Save'}
          </Button>
          {status === 'saved' && <span className="ml-1 text-xs text-success">✓</span>}
          {status !== 'idle' && status !== 'saved' && (
            <span className="ml-1 text-xs text-destructive">{status}</span>
          )}
        </td>
      </tr>
      {hasExtras && extrasOpen && (
        <tr className="border-t border-border bg-panel/30">
          <td colSpan={7} className="px-3 py-4">
            <p className="text-eyebrow mb-2 text-primary">Brand design extras</p>
            <p className="text-[10px] text-muted-foreground">
              The <strong>One-time</strong> column above is the price for a talent&rsquo;s first
              brand design. These extras drive every later purchase by the same talent.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Revision price ($)
                </span>
                <Input
                  inputMode="decimal"
                  value={revisionPrice}
                  onChange={(e) => setRevisionPrice(e.target.value)}
                  placeholder="e.g. 10"
                  className="mt-1 h-9 w-full text-sm"
                />
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  What each revision round costs after the free one (if enabled).
                </span>
              </label>
              <label className="flex flex-col">
                <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  First revision free
                </span>
                <span className="mt-1 flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3">
                  <input
                    type="checkbox"
                    checked={firstFree}
                    onChange={(e) => setFirstFree(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">Include 1 free revision</span>
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  When on, the first revision is free; later ones use the price above.
                </span>
              </label>
              <label className="block">
                <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Additional logo price ($)
                </span>
                <Input
                  inputMode="decimal"
                  value={additionalPrice}
                  onChange={(e) => setAdditionalPrice(e.target.value)}
                  placeholder="e.g. 15"
                  className="mt-1 h-9 w-full text-sm"
                />
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  Price for &lsquo;+ NEW LOGO&rsquo; — second, third, etc. brand designs by the
                  same talent.
                </span>
              </label>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Edit any value, then click <strong>Save</strong> on the row above.
            </p>
          </td>
        </tr>
      )}
    </>
  )
}
