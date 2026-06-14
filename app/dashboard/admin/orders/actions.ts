'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const updateSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(['paid', 'ready', 'provisioning', 'cancelled', 'refunded', 'pending']),
})

export async function updateOrderStatus(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = updateSchema.safeParse({
    order_id: formData.get('order_id'),
    status: formData.get('status'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role not configured' }

  const { error } = await supabase
    .from('orders')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.order_id)
  if (error) return { ok: false, message: error.message }

  revalidatePath('/dashboard/admin/orders')
  revalidatePath(`/dashboard/admin/orders/${parsed.data.order_id}`)
  return { ok: true }
}

const noteSchema = z.object({
  order_id: z.string().uuid(),
  fulfillment_notes: z.string().max(4000),
})

export async function updateOrderNotes(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = noteSchema.safeParse({
    order_id: formData.get('order_id'),
    fulfillment_notes: formData.get('fulfillment_notes'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role not configured' }

  const { error } = await supabase
    .from('orders')
    .update({ fulfillment_notes: parsed.data.fulfillment_notes })
    .eq('id', parsed.data.order_id)
  if (error) return { ok: false, message: error.message }

  revalidatePath(`/dashboard/admin/orders/${parsed.data.order_id}`)
  return { ok: true }
}
