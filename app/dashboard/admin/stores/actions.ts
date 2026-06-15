'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function deleteStore(form: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return
  const id = String(form.get('store_id') ?? '')
  if (!id) return
  await supabase.from('stores').delete().eq('id', id)
  revalidatePath('/dashboard/admin/stores')
}
