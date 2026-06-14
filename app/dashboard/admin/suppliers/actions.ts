'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { getSupplier, syncSupplier } from '@/lib/suppliers'

export type SupplierActionState = {
  ok?: boolean
  error?: string
  message?: string
  synced?: number
}

const FIELDS_BY_SUPPLIER: Record<string, string[]> = {
  ssactivewear: ['account_number', 'api_token'],
  promostandards: ['username', 'password', 'product_data_endpoint', 'inventory_endpoint'],
  sanmar: ['username', 'password', 'customer_number'],
  onesource: ['client_id', 'client_secret'],
  mock: [],
}

export async function saveSupplierCredentials(
  _prev: SupplierActionState,
  form: FormData
): Promise<SupplierActionState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }

  const code = String(form.get('supplier_code') ?? '')
  if (!code) return { error: 'Missing supplier code' }
  const fields = FIELDS_BY_SUPPLIER[code] ?? []
  const credentials: Record<string, string> = {}
  for (const field of fields) {
    const value = String(form.get(field) ?? '').trim()
    if (value) credentials[field] = value
  }
  const enabled = form.get('enabled') === 'on'

  const { error } = await supabase
    .from('supplier_credentials')
    .update({
      credentials,
      enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('supplier_code', code)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/suppliers')
  return { ok: true, message: 'Saved' }
}

export async function testSupplierConnection(
  _prev: SupplierActionState,
  form: FormData
): Promise<SupplierActionState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const code = String(form.get('supplier_code') ?? '')
  const result = await getSupplier(code)
  if (!result.ok) {
    await supabase
      .from('supplier_credentials')
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_status: 'failed',
        last_test_message: result.error,
      })
      .eq('supplier_code', code)
    revalidatePath('/dashboard/admin/suppliers')
    return { error: result.error }
  }
  const test = await result.supplier.test()
  await supabase
    .from('supplier_credentials')
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_status: test.ok ? 'ok' : 'failed',
      last_test_message: test.message,
    })
    .eq('supplier_code', code)
  revalidatePath('/dashboard/admin/suppliers')
  return test.ok ? { ok: true, message: test.message } : { error: test.message }
}

export async function syncSupplierCatalog(
  _prev: SupplierActionState,
  form: FormData
): Promise<SupplierActionState> {
  await requireAdmin()
  const code = String(form.get('supplier_code') ?? '')
  const query = String(form.get('query') ?? '').trim() || undefined
  const result = await getSupplier(code)
  if (!result.ok) return { error: result.error }
  const sync = await syncSupplier(result.supplier, query)
  if (!sync.ok) return { error: sync.error }
  revalidatePath('/dashboard/admin/suppliers')
  return { ok: true, message: `Synced ${sync.synced} products`, synced: sync.synced }
}
