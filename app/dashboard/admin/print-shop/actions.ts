'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { dispatchPrintOrder } from '@/lib/print-fulfillment'

/** Save the Print Shop fulfillment config (auto-send + channels + destinations). */
export async function savePrintFulfillmentSettings(form: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return
  const on = (k: string) => form.get(k) === 'on' || form.get(k) === '1'
  await supabase.from('print_fulfillment_settings').upsert(
    {
      id: 1,
      auto_send: on('auto_send'),
      email_enabled: on('email_enabled'),
      webhook_enabled: on('webhook_enabled'),
      partner_email: String(form.get('partner_email') ?? '').trim() || null,
      webhook_url: String(form.get('webhook_url') ?? '').trim() || null,
      webhook_auth_header: String(form.get('webhook_auth_header') ?? '').trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  revalidatePath('/dashboard/admin/print-shop')
}

/** Manually hand a paid order off to fulfillment (approve queue / resend). */
export async function sendPrintOrderToFulfillment(form: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return
  const id = String(form.get('order_id') ?? '')
  if (!id) return
  await dispatchPrintOrder(supabase, id, { force: true })
  revalidatePath('/dashboard/admin/print-shop')
}

export async function updatePrintOrderStatus(form: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return
  const id = String(form.get('order_id') ?? '')
  const status = String(form.get('status') ?? '')
  const trackingNumber = String(form.get('tracking_number') ?? '').trim() || null
  const carrier = String(form.get('carrier') ?? '').trim() || null
  if (!id || !status) return

  const update: Record<string, unknown> = {
    status,
    tracking_number: trackingNumber,
    carrier,
    updated_at: new Date().toISOString(),
  }
  if (status === 'shipped' || status === 'delivered') {
    update.shipped_at = new Date().toISOString()
  }
  await supabase.from('print_orders').update(update).eq('id', id)
  revalidatePath('/dashboard/admin/print-shop')
}
