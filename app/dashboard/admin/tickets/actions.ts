'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin, requireUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const adminReplySchema = z.object({
  ticket_id: z.string().uuid(),
  body: z.string().min(1).max(8000),
  is_internal: z.coerce.boolean().default(false),
})

export async function adminReplyToTicket(formData: FormData) {
  await requireAdmin()
  const user = await requireUser()
  const parsed = adminReplySchema.safeParse({
    ticket_id: formData.get('ticket_id'),
    body: formData.get('body'),
    is_internal:
      formData.get('is_internal') === 'on' || formData.get('is_internal') === 'true',
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  await supabase.from('ticket_replies').insert({
    ticket_id: parsed.data.ticket_id,
    author_id: user.id,
    body: parsed.data.body,
    is_internal: parsed.data.is_internal,
  })
  revalidatePath(`/dashboard/admin/tickets/${parsed.data.ticket_id}`)
}

const updateStatusSchema = z.object({
  ticket_id: z.string().uuid(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']),
})

export async function adminUpdateTicketStatus(formData: FormData) {
  await requireAdmin()
  const parsed = updateStatusSchema.safeParse({
    ticket_id: formData.get('ticket_id'),
    status: formData.get('status'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  await supabase
    .from('tickets')
    .update({
      status: parsed.data.status,
      closed_at: parsed.data.status === 'closed' ? new Date().toISOString() : null,
    })
    .eq('id', parsed.data.ticket_id)
  revalidatePath(`/dashboard/admin/tickets/${parsed.data.ticket_id}`)
  revalidatePath('/dashboard/admin/tickets')
}
