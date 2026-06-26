import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { TradingCardsManager, type AdminTier, type AdminOrder } from './manager'

export const metadata = { title: 'Trading Cards' }

interface ShipAddr {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

function shipSummary(addr: ShipAddr | null): string | null {
  if (!addr) return null
  const parts = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

export default async function AdminTradingCardsPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing — set SUPABASE_SERVICE_ROLE_KEY to manage trading-card pricing
        and orders.
      </p>
    )
  }

  const { data: tierData } = await supabase
    .from('trading_card_tiers')
    .select('id, qty, price_cents, label, sort_order, active')
    .order('sort_order', { ascending: true })
  const tiers: AdminTier[] = (tierData ?? []).map((t) => ({
    id: t.id,
    qty: t.qty,
    price_cents: t.price_cents,
    label: t.label,
    sort_order: t.sort_order ?? 0,
    active: t.active ?? true,
  }))

  const { data: orderData } = await supabase
    .from('trading_card_orders')
    .select(
      'id, order_number, user_id, quantity, amount_cents, card_url, card_style, ship_name, shipping_address, notes, status, tracking_url, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  // Resolve talent display names in one shot.
  const userIds = Array.from(new Set((orderData ?? []).map((o) => o.user_id))).filter(Boolean)
  const nameById = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      if (p.display_name) nameById.set(p.id, p.display_name)
    }
  }

  const orders: AdminOrder[] = (orderData ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    talent_name: nameById.get(o.user_id) ?? 'Unknown talent',
    quantity: o.quantity,
    amount_cents: o.amount_cents,
    card_url: o.card_url ?? null,
    card_style: o.card_style ?? null,
    ship_name: o.ship_name ?? null,
    ship_summary: shipSummary((o.shipping_address as ShipAddr | null) ?? null),
    notes: o.notes ?? null,
    status: o.status ?? 'pending',
    tracking_url: o.tracking_url ?? null,
    created_at: o.created_at,
  }))

  return <TradingCardsManager tiers={tiers} orders={orders} />
}
