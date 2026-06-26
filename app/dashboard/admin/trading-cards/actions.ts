'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const PATH = '/dashboard/admin/trading-cards'

/** Create or update a pricing tier. Price comes in as dollars. */
export async function saveTradingCardTier(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }

  const id = String(formData.get('id') ?? '').trim()
  const qty = parseInt(String(formData.get('qty') ?? ''), 10)
  const priceDollars = parseFloat(String(formData.get('price') ?? ''))
  const label = String(formData.get('label') ?? '').trim()
  const sortOrder = parseInt(String(formData.get('sort_order') ?? '0'), 10) || 0
  const active = formData.get('active') === 'on' || formData.get('active') === 'true'

  if (!qty || qty < 1) return { ok: false, message: 'Quantity must be at least 1.' }
  if (!(priceDollars >= 0)) return { ok: false, message: 'Enter a valid price.' }
  if (!label) return { ok: false, message: 'Label is required.' }

  const row = {
    qty,
    price_cents: Math.round(priceDollars * 100),
    label,
    sort_order: sortOrder,
    active,
  }

  if (id) {
    const { error } = await supabase.from('trading_card_tiers').update(row).eq('id', id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase.from('trading_card_tiers').insert(row)
    if (error) return { ok: false, message: error.message }
  }
  revalidatePath(PATH)
  return { ok: true }
}

export async function deleteTradingCardTier(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }
  const { error } = await supabase.from('trading_card_tiers').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(PATH)
  return { ok: true }
}

const VALID_STATUS = ['pending', 'paid', 'in_production', 'shipped', 'cancelled']

/** Update an order's fulfillment status and/or tracking URL. */
export async function updateTradingCardOrder(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { ok: false, message: 'Missing order id.' }
  const status = String(formData.get('status') ?? '').trim()
  const trackingUrl = String(formData.get('tracking_url') ?? '').trim()

  if (status && !VALID_STATUS.includes(status)) {
    return { ok: false, message: 'Invalid status.' }
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status) patch.status = status
  patch.tracking_url = trackingUrl || null

  const { error } = await supabase.from('trading_card_orders').update(patch).eq('id', id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(PATH)
  return { ok: true }
}
