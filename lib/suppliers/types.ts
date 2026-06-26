/**
 * Common Supplier interface — every concrete supplier implementation
 * conforms to this shape so the rest of the platform can treat them
 * uniformly.
 *
 * Connection model:
 *   - Admin stores per-supplier credentials in supplier_credentials row.
 *   - getSupplier(code) reads creds + returns an instance, or returns
 *     a "not configured" error if the row is empty / disabled.
 *
 * Sync model:
 *   - Cron pulls fresh catalog into supplier_products
 *   - Talents browse supplier_products and add to their store
 *   - Per-store_product, periodic refresh from supplier_products keeps
 *     inventory + price current
 */

export interface SupplierProduct {
  supplierSku: string
  name: string
  description?: string
  brand?: string
  category?: string
  basePriceCents: number
  wholesalePriceCents?: number
  suggestedMsrpCents?: number
  currency?: string
  primaryImageUrl?: string
  imageUrls?: string[]
  variants?: Array<{
    sku: string
    size?: string
    color?: string
    priceCents?: number
    inventory?: number
    imageUrl?: string
  }>
  colorOptions?: string[]
  sizeOptions?: string[]
  inventoryTotal?: number
  attributes?: Record<string, unknown>
}

export interface SupplierInventory {
  supplierSku: string
  variantSku?: string
  available: number
  warehouseLocation?: string
  fetchedAt: string
}

export interface SupplierSearchParams {
  query?: string
  category?: string
  limit?: number
  offset?: number
}

export interface SupplierTestResult {
  ok: boolean
  message: string
}

export interface SupplierOrderLine {
  supplierSku: string
  variantSku?: string
  quantity: number
}

export interface SupplierOrderRequest {
  lines: SupplierOrderLine[]
  shipTo: {
    name?: string
    email?: string
    address?: Record<string, unknown> | null
  }
  /** Our order id, passed through as the supplier's customer reference. */
  reference: string
}

export interface SupplierOrderResult {
  /** submitted = accepted by supplier; unsupported = route to manual; failed = error. */
  status: 'submitted' | 'unsupported' | 'failed'
  supplierOrderId?: string
  message?: string
}

export interface Supplier {
  code: string
  displayName: string

  /** Test the credentials by hitting a no-cost endpoint. */
  test(): Promise<SupplierTestResult>

  /** Search the supplier catalog. */
  search(params: SupplierSearchParams): Promise<SupplierProduct[]>

  /** Get full detail on a single product, by supplier SKU. */
  getProduct(supplierSku: string): Promise<SupplierProduct | null>

  /** Live inventory check for a SKU (and optionally a variant). */
  getInventory(supplierSku: string, variantSku?: string): Promise<SupplierInventory | null>

  /**
   * Submit a drop-ship order to the supplier. Optional — adapters without a
   * wired order API omit this, and the platform routes those orders to manual
   * fulfillment.
   */
  submitOrder?(req: SupplierOrderRequest): Promise<SupplierOrderResult>
}

export type SupplierFactoryResult =
  | { ok: true; supplier: Supplier }
  | { ok: false; error: string }
