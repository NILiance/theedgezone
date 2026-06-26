import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Trading-card physical order helpers — pricing tiers + formatting.
 *
 * Tiers live in `trading_card_tiers` (admin-editable). The defaults below
 * mirror the legacy WP plugin so the feature works before an admin ever
 * touches the table, and act as a fallback if the table is empty/missing.
 */

export interface TradingCardTier {
  id?: string
  qty: number
  price_cents: number
  label: string
  sort_order: number
  active?: boolean
}

export const DEFAULT_TC_TIERS: TradingCardTier[] = [
  { qty: 25, price_cents: 4999, label: '25 Cards', sort_order: 0 },
  { qty: 50, price_cents: 7999, label: '50 Cards', sort_order: 1 },
  { qty: 100, price_cents: 12999, label: '100 Cards', sort_order: 2 },
  { qty: 250, price_cents: 24999, label: '250 Cards', sort_order: 3 },
]

/** Premium card spec — surfaced in the order panel + emails (legacy copy). */
export const TC_CARD_SPEC =
  'Premium 2.5" x 3.5" trading cards printed on thick glossy card stock. Ships in 5–7 business days.'

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/** Per-card unit price label, e.g. "$2.00/card". */
export function perCardLabel(tier: { qty: number; price_cents: number }): string {
  if (!tier.qty) return ''
  return `${formatUsd(Math.round(tier.price_cents / tier.qty))}/card`
}

/**
 * Read active pricing tiers, sorted. Falls back to DEFAULT_TC_TIERS when
 * the table is empty or unavailable (e.g. migration not yet applied), so
 * the order panel always renders something sensible.
 */
export async function getTradingCardTiers(
  supabase: SupabaseClient
): Promise<TradingCardTier[]> {
  try {
    const { data, error } = await supabase
      .from('trading_card_tiers')
      .select('id, qty, price_cents, label, sort_order, active')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return DEFAULT_TC_TIERS
    return data as TradingCardTier[]
  } catch {
    return DEFAULT_TC_TIERS
  }
}

/** Short, human-friendly order number, e.g. "TC-9F3A2C7B". */
export function makeOrderNumber(): string {
  // crypto.randomUUID is available in the Node + edge runtimes we target.
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  return `TC-${uuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}
