'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

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
