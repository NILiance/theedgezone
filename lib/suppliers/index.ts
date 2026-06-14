import { createServiceClient } from '@/lib/supabase/server'
import type { Supplier, SupplierFactoryResult } from './types'
import { MockSupplier } from './mock'
import { SsActivewearSupplier } from './ssactivewear'
import { PromoStandardsSupplier } from './promostandards'

export type { Supplier, SupplierProduct, SupplierSearchParams, SupplierInventory } from './types'

export const KNOWN_SUPPLIER_CODES = [
  'mock',
  'promostandards',
  'ssactivewear',
  'sanmar',
  'onesource',
] as const
export type KnownSupplierCode = (typeof KNOWN_SUPPLIER_CODES)[number]

interface SupplierRow {
  supplier_code: string
  enabled: boolean
  credentials: Record<string, unknown>
}

async function loadRow(code: string): Promise<SupplierRow | null> {
  const supabase = createServiceClient()
  if (!supabase) return null
  const { data } = await supabase
    .from('supplier_credentials')
    .select('supplier_code, enabled, credentials')
    .eq('supplier_code', code)
    .maybeSingle()
  return data
}

export async function getSupplier(code: string): Promise<SupplierFactoryResult> {
  const row = await loadRow(code)
  if (!row) return { ok: false, error: `Unknown supplier: ${code}` }
  if (!row.enabled && code !== 'mock') {
    return { ok: false, error: `Supplier ${code} is disabled. Enable in admin → suppliers.` }
  }
  switch (code) {
    case 'mock':
      return { ok: true, supplier: new MockSupplier() }
    case 'ssactivewear': {
      const creds = row.credentials as { account_number?: string; api_token?: string }
      if (!creds.account_number || !creds.api_token) {
        return { ok: false, error: 'S&S Activewear: account_number and api_token required' }
      }
      return {
        ok: true,
        supplier: new SsActivewearSupplier({
          accountNumber: creds.account_number,
          apiToken: creds.api_token,
        }),
      }
    }
    case 'promostandards': {
      const creds = row.credentials as {
        product_data_endpoint?: string
        inventory_endpoint?: string
        username?: string
        password?: string
      }
      if (!creds.username || !creds.password) {
        return { ok: false, error: 'PromoStandards: username and password required' }
      }
      return {
        ok: true,
        supplier: new PromoStandardsSupplier({
          productDataEndpoint: creds.product_data_endpoint,
          inventoryEndpoint: creds.inventory_endpoint,
          username: creds.username,
          password: creds.password,
        }),
      }
    }
    case 'sanmar':
    case 'onesource':
      return {
        ok: false,
        error: `${code} integration is not wired yet — drop creds in admin and we'll plug it in.`,
      }
    default:
      return { ok: false, error: `Unknown supplier code: ${code}` }
  }
}

/**
 * Upserts every product the supplier returns into supplier_products.
 * Used by /api/cron/supplier-sync.
 */
export async function syncSupplier(
  supplier: Supplier,
  query?: string
): Promise<{ ok: true; synced: number } | { ok: false; error: string }> {
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, error: 'Service role key missing' }

  try {
    const products = await supplier.search({ query, limit: 200 })
    let synced = 0
    for (const p of products) {
      await supabase
        .from('supplier_products')
        .upsert(
          {
            supplier_code: supplier.code,
            supplier_sku: p.supplierSku,
            name: p.name,
            description: p.description ?? null,
            brand: p.brand ?? null,
            category: p.category ?? null,
            base_price_cents: p.basePriceCents,
            wholesale_price_cents: p.wholesalePriceCents ?? null,
            suggested_msrp_cents: p.suggestedMsrpCents ?? null,
            currency: p.currency ?? 'usd',
            primary_image_url: p.primaryImageUrl ?? null,
            image_urls: p.imageUrls ?? [],
            variants: p.variants ?? [],
            color_options: p.colorOptions ?? [],
            size_options: p.sizeOptions ?? [],
            inventory_total: p.inventoryTotal ?? null,
            attributes: p.attributes ?? {},
            last_synced_at: new Date().toISOString(),
            active: true,
          },
          { onConflict: 'supplier_code,supplier_sku' }
        )
      synced += 1
    }
    return { ok: true, synced }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown sync error' }
  }
}
