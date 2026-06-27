'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateAppPayout } from '../actions'

interface Earnings {
  balance_cents?: number
  ad_revenue_cents?: number
  merch_revenue_cents?: number
  paid_cents?: number
  impressions?: number
  clicks?: number
  merch_orders?: number
  merch_gross_cents?: number
}

const usd = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Earnings tab — payout balances, ad performance, merch sales, payout method. */
export function EarningsTab({
  appId,
  earnings,
  payout,
}: {
  appId: string
  earnings: Earnings
  payout: { method?: string; handle?: string }
}) {
  const e = earnings
  const [method, setMethod] = useState(payout.method ?? 'paypal')
  const [handle, setHandle] = useState(payout.handle ?? '')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const ctr = e.impressions && e.impressions > 0 ? ((e.clicks ?? 0) / e.impressions) * 100 : 0

  const save = () => {
    setStatus(null)
    const fd = new FormData()
    fd.set('app_id', appId)
    fd.set('method', method)
    fd.set('handle', handle)
    startTransition(async () => {
      const r = await updateAppPayout(fd)
      setStatus(r.ok ? 'Saved.' : r.message ?? 'Save failed')
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pending Payout" value={usd(e.balance_cents ?? 0)} accent />
        <Stat label="Ad Revenue (Lifetime)" value={usd(e.ad_revenue_cents ?? 0)} />
        <Stat label="Merch Revenue (Lifetime)" value={usd(e.merch_revenue_cents ?? 0)} />
        <Stat label="Paid Out" value={usd(e.paid_cents ?? 0)} />
      </div>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-display font-bold">📊 Ad Performance</p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Mini label="Impressions" value={(e.impressions ?? 0).toLocaleString()} />
          <Mini label="Clicks" value={(e.clicks ?? 0).toLocaleString()} />
          <Mini label="Click-through rate" value={`${ctr.toFixed(0)}%`} />
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-display font-bold">👕 Merch Sales</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-center">
          <Mini label="Total orders" value={(e.merch_orders ?? 0).toLocaleString()} />
          <Mini label="Gross sales (your share calculated)" value={usd(e.merch_gross_cents ?? 0)} />
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-eyebrow text-primary">Payout method</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Method</span>
            <select value={method} onChange={(e2) => setMethod(e2.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm">
              <option value="paypal">PayPal</option>
              <option value="venmo">Venmo</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">{method === 'venmo' ? 'Venmo username' : 'PayPal email'}</span>
            <input value={handle} onChange={(e2) => setHandle(e2.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" onClick={save} disabled={isPending}>{isPending ? 'Saving…' : 'Save payout method'}</Button>
          {status && <p className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}>{status}</p>}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4 text-center">
      <p className={`text-display text-2xl font-black ${accent ? 'text-success' : 'text-foreground'}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  )
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-display text-xl font-black">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
