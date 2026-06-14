'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  subject: z.string().min(5).max(200),
  body: z.string().min(10).max(8000),
  category: z.string().max(40).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
})

export async function createTicket(formData: FormData) {
  const user = await requireUser()
  const parsed = createSchema.safeParse({
    subject: formData.get('subject'),
    body: formData.get('body'),
    category: formData.get('category') || undefined,
    priority: formData.get('priority') || 'normal',
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      user_id: user.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      category: parsed.data.category ?? 'general',
      priority: parsed.data.priority,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create ticket')

  revalidatePath('/dashboard/support')
  redirect(`/dashboard/support/${data.id}`)
}

const replySchema = z.object({
  ticket_id: z.string().uuid(),
  body: z.string().min(1).max(8000),
})

export async function replyToTicket(formData: FormData) {
  const user = await requireUser()
  const parsed = replySchema.safeParse({
    ticket_id: formData.get('ticket_id'),
    body: formData.get('body'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  const supabase = await createClient()
  await supabase.from('ticket_replies').insert({
    ticket_id: parsed.data.ticket_id,
    author_id: user.id,
    body: parsed.data.body,
    is_internal: false,
  })
  revalidatePath(`/dashboard/support/${parsed.data.ticket_id}`)
}
