'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function setSupplierProductApproval(
  id: string,
  approved: boolean
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }
  const { error } = await supabase
    .from('supplier_products')
    .update({ approved })
    .eq('id', id)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/dashboard/admin/suppliers/catalog')
  return { ok: true }
}

export async function bulkApproveSupplierProducts(
  ids: string[],
  approved: boolean
): Promise<{ ok: boolean; count?: number; message?: string }> {
  await requireAdmin()
  if (ids.length === 0) return { ok: true, count: 0 }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing.' }
  const { error } = await supabase
    .from('supplier_products')
    .update({ approved })
    .in('id', ids)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/dashboard/admin/suppliers/catalog')
  return { ok: true, count: ids.length }
}
