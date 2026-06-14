'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type ImportState = { ok?: boolean; error?: string; productId?: string }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'product'
}

export async function importSupplierProduct(
  _prev: ImportState,
  form: FormData
): Promise<ImportState> {
  const user = await requireUser()
  const storeId = String(form.get('store_id') ?? '')
  const supplierProductId = String(form.get('supplier_product_id') ?? '')
  const retailPriceCents = Math.max(0, Math.round(Number(form.get('retail_price_cents') ?? 0)))

  if (!storeId || !supplierProductId) return { error: 'Missing id' }
  if (retailPriceCents <= 0) return { error: 'Retail price must be greater than 0' }

  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('id, user_id')
    .eq('id', storeId)
    .single()
  if (!store || store.user_id !== user.id) return { error: 'Not your store' }

  const { data: supplier } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('id', supplierProductId)
    .single()
  if (!supplier) return { error: 'Supplier product not found' }

  const { data: existing } = await supabase
    .from('store_products')
    .select('id')
    .eq('store_id', storeId)
    .eq('supplier_product_id', supplierProductId)
    .maybeSingle()
  if (existing) return { error: 'Already in your store', productId: existing.id }

  let slug = slugify(supplier.name)
  const { data: slugCheck } = await supabase
    .from('store_products')
    .select('id')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .maybeSingle()
  if (slugCheck) slug = `${slug}-${Math.floor(Math.random() * 9000 + 1000)}`

  const { data: position } = await supabase
    .from('store_products')
    .select('position')
    .eq('store_id', storeId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = ((position?.position as number | undefined) ?? -1) + 1

  const { data: row, error } = await supabase
    .from('store_products')
    .insert({
      store_id: storeId,
      slug,
      name: supplier.name,
      description: supplier.description ?? null,
      price_cents: retailPriceCents,
      compare_at_cents: supplier.suggested_msrp_cents ?? null,
      currency: supplier.currency ?? 'usd',
      inventory: supplier.inventory_total ?? null,
      supplier: supplier.supplier_code,
      supplier_sku: supplier.supplier_sku,
      supplier_payload: supplier.attributes ?? {},
      supplier_product_id: supplier.id,
      supplier_last_synced_at: new Date().toISOString(),
      supplier_sync_status: 'fresh',
      primary_image_url: supplier.primary_image_url ?? null,
      image_urls: supplier.image_urls ?? [],
      variants: supplier.variants ?? [],
      position: nextPosition,
      active: true,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/stores/${storeId}`)
  revalidatePath(`/dashboard/stores/${storeId}/catalog`)
  return { ok: true, productId: row.id }
}
