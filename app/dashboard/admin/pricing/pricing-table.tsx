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
  const [status, setStatus] = useState<'idle' | 'saved' | string>('idle')
  const [isPending, startTransition] = useTransition()

  const save = () => {
    setStatus('idle')
    const fd = new FormData()
    fd.set('service_slug', initial.service_slug)
    fd.set('plan_monthly_cents', monthly === '' ? '' : String(Math.round(Number(monthly) * 100)))
    fd.set('plan_annual_cents', annual === '' ? '' : String(Math.round(Number(annual) * 100)))
    fd.set('plan_onetime_cents', onetime === '' ? '' : String(Math.round(Number(onetime) * 100)))
    if (custom.trim()) fd.set('custom_label', custom.trim())
    fd.set('active', active ? 'on' : 'false')
    startTransition(async () => {
      const res = await upsertServicePricing(fd)
      setStatus(res.ok ? 'saved' : res.message ?? 'Failed')
    })
  }

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2">
        <p className="text-display font-bold text-foreground">{initial.title}</p>
        <p className="text-[10px] text-muted-foreground">
          <code>{initial.service_slug}</code> ·{' '}
          {categoriesByKey[initial.category] ?? initial.category} · {initial.audience}
          {!initial.hasOverride && ' · using default'}
        </p>
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
  )
}
