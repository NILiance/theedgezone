'use client'

import { useState, useTransition } from 'react'
import {
  saveTradingCardTier,
  deleteTradingCardTier,
  updateTradingCardOrder,
} from './actions'

export interface AdminTier {
  id: string
  qty: number
  price_cents: number
  label: string
  sort_order: number
  active: boolean
}

export interface AdminOrder {
  id: string
  order_number: string
  talent_name: string
  quantity: number
  amount_cents: number
  card_url: string | null
  card_style: string | null
  ship_name: string | null
  ship_summary: string | null
  notes: string | null
  status: string
  tracking_url: string | null
  created_at: string
}

const STATUSES = ['pending', 'paid', 'in_production', 'shipped', 'cancelled']
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  in_production: 'In production',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'text-muted-foreground',
  paid: 'text-success',
  in_production: 'text-accent',
  shipped: 'text-primary',
  cancelled: 'text-destructive',
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function TradingCardsManager({
  tiers,
  orders,
}: {
  tiers: AdminTier[]
  orders: AdminOrder[]
}) {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-display text-2xl font-black">Trading Cards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage quantity pricing tiers and fulfill printed-card orders.
        </p>
      </header>

      <PricingTiers tiers={tiers} />
      <Orders orders={orders} />
    </div>
  )
}

function PricingTiers({ tiers }: { tiers: AdminTier[] }) {
  return (
    <section>
      <h2 className="text-display text-lg font-bold">Pricing tiers</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Quantity options shown to talent. Per-card price is computed automatically.
      </p>
      <div className="mt-4 space-y-2">
        <div className="hidden grid-cols-[80px_110px_1fr_70px_70px_auto] gap-2 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:grid">
          <span>Qty</span>
          <span>Price ($)</span>
          <span>Label</span>
          <span>Sort</span>
          <span>Active</span>
          <span />
        </div>
        {tiers.map((t) => (
          <TierRow key={t.id} tier={t} />
        ))}
        <TierRow tier={null} />
      </div>
    </section>
  )
}

function TierRow({ tier }: { tier: AdminTier | null }) {
  const [qty, setQty] = useState(tier ? String(tier.qty) : '')
  const [price, setPrice] = useState(tier ? (tier.price_cents / 100).toFixed(2) : '')
  const [label, setLabel] = useState(tier?.label ?? '')
  const [sort, setSort] = useState(tier ? String(tier.sort_order) : '')
  const [active, setActive] = useState(tier ? tier.active : true)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const perCard =
    Number(qty) > 0 && Number(price) >= 0
      ? `$${(Number(price) / Number(qty)).toFixed(2)}/card`
      : ''

  const save = () => {
    setMsg(null)
    start(async () => {
      const fd = new FormData()
      if (tier) fd.set('id', tier.id)
      fd.set('qty', qty)
      fd.set('price', price)
      fd.set('label', label)
      fd.set('sort_order', sort || '0')
      fd.set('active', active ? 'on' : 'false')
      const res = await saveTradingCardTier(fd)
      if (!res.ok) setMsg(res.message ?? 'Could not save.')
      else if (!tier) {
        // Clear the "add" row after a successful insert.
        setQty('')
        setPrice('')
        setLabel('')
        setSort('')
        setActive(true)
        setMsg('Added')
      } else setMsg('Saved')
    })
  }

  const remove = () => {
    if (!tier) return
    if (!confirm(`Delete the "${tier.label}" tier?`)) return
    start(async () => {
      const res = await deleteTradingCardTier(tier.id)
      if (!res.ok) setMsg(res.message ?? 'Could not delete.')
    })
  }

  return (
    <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-sm)] border border-border bg-panel/40 p-2 sm:grid-cols-[80px_110px_1fr_70px_70px_auto] sm:items-center sm:bg-transparent sm:p-1">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Qty"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        type="number"
        min={0}
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. 25 Cards"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        type="number"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        placeholder="0"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
      />
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="accent-[var(--primary)]"
        />
        <span className="sm:hidden">Active</span>
      </label>
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {tier ? 'Save' : '+ Add'}
        </button>
        {tier && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[10px] font-bold text-destructive disabled:opacity-50"
          >
            🗑
          </button>
        )}
        {perCard && <span className="text-[10px] text-muted-foreground">{perCard}</span>}
        {msg && <span className="text-[10px] text-success">{msg}</span>}
      </div>
    </div>
  )
}

function Orders({ orders }: { orders: AdminOrder[] }) {
  return (
    <section>
      <h2 className="text-display text-lg font-bold">Orders ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="mt-3 rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No trading-card orders yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </section>
  )
}

function OrderCard({ order }: { order: AdminOrder }) {
  const [status, setStatus] = useState(order.status)
  const [tracking, setTracking] = useState(order.tracking_url ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const save = () => {
    setMsg(null)
    start(async () => {
      const fd = new FormData()
      fd.set('id', order.id)
      fd.set('status', status)
      fd.set('tracking_url', tracking)
      const res = await updateTradingCardOrder(fd)
      setMsg(res.ok ? 'Saved' : res.message ?? 'Could not save.')
    })
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <div className="flex flex-wrap items-start gap-4">
        {order.card_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={order.card_url}
            alt="Card"
            className="h-24 w-auto rounded-md border border-border bg-white object-contain"
          />
        )}
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-display font-bold">{order.order_number}</p>
            <p className={`text-display text-xs font-bold uppercase tracking-widest ${STATUS_COLOR[order.status] ?? ''}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </p>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {order.talent_name} · {order.quantity} cards · {usd(order.amount_cents)}
            {order.card_style ? ` · ${order.card_style}` : ''}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          {(order.ship_name || order.ship_summary) && (
            <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">
              <span className="font-bold text-foreground">Ship to: </span>
              {[order.ship_name, order.ship_summary].filter(Boolean).join(' — ')}
            </p>
          )}
          {order.notes && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">Notes: </span>
              {order.notes}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-3">
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Tracking URL
          </span>
          <input
            type="url"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {msg && <span className="text-[10px] text-success">{msg}</span>}
      </div>
    </div>
  )
}
