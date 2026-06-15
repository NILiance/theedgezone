'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function deleteSite(form: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return
  const id = String(form.get('site_id') ?? '')
  if (!id) return
  // Cascade: drop the order(s) pointing to this site so the talent's
  // dashboard stops showing a "Personal Website · READY" orphan card.
  await supabase.from('orders').delete().eq('provisioned_entity_id', id)
  await supabase.from('sites').delete().eq('id', id)
  revalidatePath('/dashboard/admin/websites')
}
