import type {
  Supplier,
  SupplierProduct,
  SupplierSearchParams,
  SupplierTestResult,
} from './types'

/**
 * S&S Activewear REST API client.
 *
 * Docs: https://api.ssactivewear.com/
 * Auth: HTTP Basic with (account, token) pair.
 *
 * Notable endpoints:
 *   - GET /v2/products?style=...           — search by style #
 *   - GET /v2/products/{styleId}           — product detail
 *   - GET /v2/inventory/{sku}              — per-SKU inventory
 *
 * Pricing comes back in the product detail. Multiple SKUs per product
 * (one per color × size).
 */

interface SsCreds {
  accountNumber: string
  apiToken: string
  baseUrl?: string
}

interface SsRawProduct {
  productId?: number
  styleId?: number
  partNumber?: string
  sku?: string
  styleName?: string
  brandName?: string
  description?: string
  shortDescription?: string
  customerPrice?: number
  piecePrice?: number
  salePrice?: number
  colorName?: string
  sizeName?: string
  qty?: number
  colorFrontImage?: string
  colorBackImage?: string
  colorSideImage?: string
  baseCategory?: string
}

export class SsActivewearSupplier implements Supplier {
  code = 'ssactivewear'
  displayName = 'S&S Activewear'
  private auth: string
  private baseUrl: string

  constructor(creds: SsCreds) {
    this.auth = 'Basic ' + Buffer.from(`${creds.accountNumber}:${creds.apiToken}`).toString('base64')
    this.baseUrl = (creds.baseUrl ?? 'https://api.ssactivewear.com/v2').replace(/\/+$/, '')
  }

  private headers(): Record<string, string> {
    return {
      Authorization: this.auth,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  async test(): Promise<SupplierTestResult> {
    try {
      const res = await fetch(`${this.baseUrl}/categories`, { headers: this.headers() })
      if (!res.ok) {
        const text = await res.text()
        return { ok: false, message: `HTTP ${res.status}: ${text.slice(0, 120)}` }
      }
      return { ok: true, message: 'Connected — categories endpoint responded' }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Network error' }
    }
  }

  async search(params: SupplierSearchParams): Promise<SupplierProduct[]> {
    const query = (params.query ?? '').trim()
    if (!query) return []
    try {
      const url = `${this.baseUrl}/products?style=${encodeURIComponent(query)}`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return []
      const json = (await res.json()) as SsRawProduct[] | { products?: SsRawProduct[] }
      const rows = Array.isArray(json) ? json : json.products ?? []
      return groupSsRows(rows).slice(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50))
    } catch {
      return []
    }
  }

  async getProduct(supplierSku: string): Promise<SupplierProduct | null> {
    try {
      const url = `${this.baseUrl}/products/${encodeURIComponent(supplierSku)}`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return null
      const json = (await res.json()) as SsRawProduct[] | { products?: SsRawProduct[] }
      const rows = Array.isArray(json) ? json : json.products ?? []
      const grouped = groupSsRows(rows)
      return grouped[0] ?? null
    } catch {
      return null
    }
  }

  async getInventory(supplierSku: string, variantSku?: string) {
    try {
      const sku = variantSku ?? supplierSku
      const url = `${this.baseUrl}/inventory/${encodeURIComponent(sku)}`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return null
      const json = (await res.json()) as { qty?: number; warehouseAbbr?: string }
      return {
        supplierSku,
        variantSku,
        available: json.qty ?? 0,
        warehouseLocation: json.warehouseAbbr,
        fetchedAt: new Date().toISOString(),
      }
    } catch {
      return null
    }
  }
}

function groupSsRows(rows: SsRawProduct[]): SupplierProduct[] {
  const byStyle = new Map<string, SupplierProduct & { _seenSkus: Set<string> }>()
  for (const r of rows) {
    const styleKey = String(r.styleId ?? r.partNumber ?? r.sku ?? '')
    if (!styleKey) continue
    let agg = byStyle.get(styleKey)
    if (!agg) {
      agg = {
        supplierSku: styleKey,
        name: r.styleName ?? r.shortDescription ?? styleKey,
        description: r.description ?? r.shortDescription,
        brand: r.brandName,
        category: r.baseCategory,
        basePriceCents: priceToCents(r.salePrice ?? r.piecePrice ?? r.customerPrice),
        wholesalePriceCents: priceToCents(r.piecePrice ?? r.customerPrice),
        currency: 'usd',
        primaryImageUrl: r.colorFrontImage ?? r.colorSideImage ?? undefined,
        imageUrls: [r.colorFrontImage, r.colorBackImage, r.colorSideImage].filter(
          (u): u is string => Boolean(u)
        ),
        colorOptions: [],
        sizeOptions: [],
        variants: [],
        inventoryTotal: 0,
        _seenSkus: new Set(),
      }
      byStyle.set(styleKey, agg)
    }
    if (r.colorName && !agg.colorOptions!.includes(r.colorName)) agg.colorOptions!.push(r.colorName)
    if (r.sizeName && !agg.sizeOptions!.includes(r.sizeName)) agg.sizeOptions!.push(r.sizeName)
    if (r.sku && !agg._seenSkus.has(r.sku)) {
      agg._seenSkus.add(r.sku)
      agg.variants!.push({
        sku: r.sku,
        size: r.sizeName,
        color: r.colorName,
        priceCents: priceToCents(r.salePrice ?? r.piecePrice ?? r.customerPrice),
        inventory: r.qty ?? 0,
      })
      agg.inventoryTotal! += r.qty ?? 0
    }
  }
  return Array.from(byStyle.values()).map(({ _seenSkus: _unused, ...rest }) => {
    void _unused
    return rest
  })
}

function priceToCents(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.round(value * 100)
}
