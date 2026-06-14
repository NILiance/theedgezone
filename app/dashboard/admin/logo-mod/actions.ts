'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function updateLogoModRequest(form: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return
  const id = String(form.get('request_id') ?? '')
  const status = String(form.get('status') ?? '')
  const urlsRaw = String(form.get('delivered_logo_urls') ?? '')
  const urls = urlsRaw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  const update: Record<string, unknown> = {
    status,
    delivered_logo_urls: urls,
    updated_at: new Date().toISOString(),
  }
  if (status === 'delivered') {
    update.delivered_at = new Date().toISOString()
  }
  await supabase.from('logo_mod_requests').update(update).eq('id', id)
  revalidatePath('/dashboard/admin/logo-mod')
}
