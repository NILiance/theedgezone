'use client'

import { useState } from 'react'
import { roiTier, ROI_DISCLAIMER, type RoiTier } from '@/lib/roi-tier'

/**
 * Public, brand-facing ROI calculator shown under a talent's NILfluence score.
 * A brand enters their profit per product + the estimated purchase rate of the
 * athlete's engagements; we project break-even, revenue, and ROI using the
 * athlete's reach + engagement. Same math as the talent's Brand ROI block.
 */
export function BrandRoiCalculator({
  name,
  followers,
  er,
  postValue,
}: {
  name: string
  followers: number
  er: number
  postValue: number
}) {
  const [open, setOpen] = useState(false)
  const [profit, setProfit] = useState(45)
  const [rate, setRate] = useState(5) // % of engagements that convert

  const totalEngagements = followers * er
  const productsSold = totalEngagements * ((rate || 0) / 100)
  const revenue = productsSold * (profit || 0)
  const net = revenue - postValue
  const roi = revenue > 0 ? (revenue - postValue) / revenue : 0
  const breakeven = profit > 0 ? postValue / profit : 0
  const tier = roiTier(roi)

  const usd = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const num = (v: number, d = 0) => v.toLocaleString(undefined, { maximumFractionDigits: d })

  if (!open) {
    return (
      <div className="mt-5 border-t border-border pt-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-display w-full rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
        >
          📈 Calculate Your ROI
        </button>
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-3 border-t border-border pt-5 text-left">
      <p className="text-eyebrow text-primary">Your ROI with {name}</p>
      <Field label="Profit per product sold ($)">
        <input
          type="number"
          min={0}
          value={profit}
          onChange={(e) => setProfit(Number(e.target.value) || 0)}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
      </Field>
      <Field label="Purchase rate (% of engagements)">
        <input
          type="number"
          min={0}
          step={0.5}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value) || 0)}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
        />
      </Field>
      <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border">
        <Row label="Post value (your cost)" value={usd(postValue)} />
        <Row label="Products to break even" value={num(breakeven, 1)} />
        <Row label="Est. products sold" value={num(productsSold)} />
        <Row label="Projected revenue" value={usd(revenue)} />
        <Row label="Projected profit" value={usd(net)} />
        <Row label="ROI" value={`${(roi * 100).toFixed(1)}%`} highlight tier={tier} />
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">{ROI_DISCLAIMER}</p>
      <p className="text-[10px] leading-snug text-muted-foreground">
        Estimate from this athlete&rsquo;s reach + engagement. Post value uses an industry average of
        $10 per 1,000 followers at 1% engagement.
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px]">
      <span className="block uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Row({
  label,
  value,
  highlight,
  tier,
}: {
  label: string
  value: string
  highlight?: boolean
  tier?: RoiTier
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-[11px] last:border-b-0 ${
        highlight ? 'bg-primary/10' : ''
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        {tier && (
          <span
            className="text-display rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest"
            style={{ color: tier.color, backgroundColor: `${tier.color}1f` }}
          >
            {tier.label}
          </span>
        )}
        <span
          className={`text-display font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}
        >
          {value}
        </span>
      </span>
    </div>
  )
}
