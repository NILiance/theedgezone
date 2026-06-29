import type {
  Supplier,
  SupplierProduct,
  SupplierSearchParams,
  SupplierTestResult,
  SupplierOrderRequest,
  SupplierOrderResult,
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
  styleID?: number // S&S uses capital-ID — this is the canonical style group key
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

// Popular blank "brand + style" searches used to seed the catalog when the admin
// runs a sync with no query. These are TEXT searches (resolved via
// /styles?search=), because S&S's /products `style` param matches the internal
// styleID, NOT the printed style number. Admins search the same way, e.g.
// "Gildan 5000" or "Bella Canvas 3001".
const DEFAULT_SS_SEARCHES = [
  'Gildan 5000', // Heavy Cotton Tee
  'Gildan 64000', // Softstyle Tee
  'Gildan 2000', // Ultra Cotton Tee
  'Gildan 18500', // Heavy Blend Hoodie
  'Gildan 18000', // Heavy Blend Crewneck
  'Gildan 5400', // Long Sleeve Tee
  'Bella Canvas 3001', // Unisex Jersey Tee
  'Next Level 6210', // CVC Tee
  'Comfort Colors 1717', // Garment-Dyed Tee
  'Independent Trading SS4500', // Hoodie
]

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
    // S&S's /products `style` param matches the INTERNAL styleID, not the printed
    // style number. So we text-search /styles first to turn a brand+number like
    // "Gildan 5000" into its styleID, then pull that style's products. Terms are
    // comma/newline separated; spaces stay within a term ("Gildan 5000").
    const terms = query
      ? query
          .split(/[,\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : DEFAULT_SS_SEARCHES

    const styleIds: number[] = []
    for (const term of terms) {
      if (styleIds.length >= 40) break
      styleIds.push(...(await this.searchStyleIds(term)))
    }
    const uniqueIds = [...new Set(styleIds)].slice(0, 40)

    const limit = params.limit ?? 50
    const offset = params.offset ?? 0
    const out: SupplierProduct[] = []
    const seen = new Set<string>()
    for (const sid of uniqueIds) {
      if (out.length >= offset + limit) break
      const rows = await this.fetchStyleProducts(sid)
      const grouped = groupSsRows(rows)
      console.log(`[ssactivewear] styleID ${sid}: ${rows.length} rows → ${grouped.length} product(s)`)
      for (const p of grouped) {
        if (seen.has(p.supplierSku)) continue
        seen.add(p.supplierSku)
        out.push(p)
      }
    }
    return out.slice(offset, offset + limit)
  }

  /** Resolve a "brand style" text search (e.g. "Gildan 5000") to S&S styleIDs. */
  private async searchStyleIds(term: string): Promise<number[]> {
    try {
      const res = await fetch(`${this.baseUrl}/styles?search=${encodeURIComponent(term)}`, {
        headers: this.headers(),
      })
      if (!res.ok) {
        console.warn(`[ssactivewear] styles "${term}": HTTP ${res.status}`)
        return []
      }
      const json = (await res.json()) as Array<{ styleID?: number }>
      const ids = (Array.isArray(json) ? json : [])
        .map((s) => s.styleID)
        .filter((n): n is number => typeof n === 'number')
      console.log(`[ssactivewear] styles "${term}": ${ids.length} match(es)`)
      return ids.slice(0, 10)
    } catch (err) {
      console.warn(`[ssactivewear] styles "${term}": ${err instanceof Error ? err.message : 'failed'}`)
      return []
    }
  }

  /** Pull every SKU row for a styleID via /products?style={styleID}. */
  private async fetchStyleProducts(styleId: number): Promise<SsRawProduct[]> {
    try {
      const res = await fetch(`${this.baseUrl}/products?style=${styleId}`, { headers: this.headers() })
      if (!res.ok) return []
      const json = (await res.json()) as SsRawProduct[] | { products?: SsRawProduct[] }
      return Array.isArray(json) ? json : json.products ?? []
    } catch {
      return []
    }
  }

  async getProduct(supplierSku: string): Promise<SupplierProduct | null> {
    const sid = Number(supplierSku)
    if (!Number.isFinite(sid)) return null
    const grouped = groupSsRows(await this.fetchStyleProducts(sid))
    return grouped[0] ?? null
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

  /**
   * Drop-ship order placement via POST /v2/orders/.
   *
   * Opt-in: only fires when SS_AUTO_FULFILL=true, so testing can't place (and
   * pay for) a real S&S order. Set SS_TEST_ORDERS=true to send S&S's testOrder
   * flag — validates the order without committing it. SS_SHIPPING_METHOD sets
   * a method code (omitted → account default). Any non-2xx returns 'failed'
   * with S&S's error text so the dispatcher routes it to manual.
   */
  async submitOrder(req: SupplierOrderRequest): Promise<SupplierOrderResult> {
    if (process.env.SS_AUTO_FULFILL !== 'true') {
      return { status: 'unsupported', message: 'S&S auto-fulfill disabled (set SS_AUTO_FULFILL=true)' }
    }
    const addr = normalizeAddress(req.shipTo.address)
    if (!addr) return { status: 'failed', message: 'Order has no usable shipping address' }

    const isTest = process.env.SS_TEST_ORDERS === 'true'
    const body: Record<string, unknown> = {
      poNumber: req.reference.slice(0, 30),
      testOrder: isTest,
      emailConfirmation: req.shipTo.email || undefined,
      shippingAddress: {
        customer: req.shipTo.name || addr.name || 'Customer',
        address1: addr.address1,
        address2: addr.address2,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country || 'US',
      },
      lines: req.lines.map((l) => ({ identifier: l.variantSku || l.supplierSku, qty: l.quantity })),
    }
    if (process.env.SS_SHIPPING_METHOD) body.shippingMethod = process.env.SS_SHIPPING_METHOD

    try {
      const res = await fetch(`${this.baseUrl}/orders/`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      })
      const text = await res.text()
      if (!res.ok) {
        return { status: 'failed', message: `S&S HTTP ${res.status}: ${text.slice(0, 200)}` }
      }
      let parsed: unknown = null
      try {
        parsed = JSON.parse(text)
      } catch {
        /* non-JSON success body is fine */
      }
      const obj = (Array.isArray(parsed) ? parsed[0] : parsed) as Record<string, unknown> | null
      const idVal = obj?.orderNumber ?? obj?.invoiceNumber ?? obj?.poNumber ?? obj?.guid
      return {
        status: 'submitted',
        supplierOrderId: idVal != null ? String(idVal) : undefined,
        message: isTest ? 'Submitted (S&S TEST order)' : 'Submitted to S&S Activewear',
      }
    } catch (err) {
      return { status: 'failed', message: err instanceof Error ? err.message : 'S&S order request failed' }
    }
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

/**
 * Accepts either a flat address or Stripe's shipping_details shape
 * ({ name, address: { line1, city, state, postal_code, country } }).
 */
function normalizeAddress(
  raw: Record<string, unknown> | null | undefined
): { name?: string; address1: string; address2?: string; city: string; state: string; zip: string; country?: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const inner =
    raw.address && typeof raw.address === 'object'
      ? (raw.address as Record<string, unknown>)
      : raw
  const address1 = str(inner.line1) || str(inner.address1)
  const city = str(inner.city)
  const state = str(inner.state)
  const zip = str(inner.postal_code) || str(inner.zip)
  if (!address1 || !city || !zip) return null
  return {
    name: str(raw.name) || str(inner.name) || undefined,
    address1,
    address2: str(inner.line2) || str(inner.address2) || undefined,
    city,
    state,
    zip,
    country: str(inner.country) || undefined,
  }
}

function groupSsRows(rows: SsRawProduct[]): SupplierProduct[] {
  const byStyle = new Map<
    string,
    SupplierProduct & { _seenSkus: Set<string>; _colorImages: Record<string, string> }
  >()
  for (const r of rows) {
    const styleKey = String(r.styleID ?? r.styleId ?? r.partNumber ?? r.sku ?? '')
    if (!styleKey) continue
    let agg = byStyle.get(styleKey)
    if (!agg) {
      agg = {
        supplierSku: styleKey,
        name:
          [r.brandName, r.styleName].filter(Boolean).join(' ').trim() ||
          r.shortDescription ||
          styleKey,
        description: r.description ?? r.shortDescription,
        brand: r.brandName,
        category: r.baseCategory,
        basePriceCents: priceToCents(r.salePrice ?? r.piecePrice ?? r.customerPrice),
        wholesalePriceCents: priceToCents(r.piecePrice ?? r.customerPrice),
        currency: 'usd',
        primaryImageUrl: ssImageUrl(r.colorFrontImage) ?? ssImageUrl(r.colorSideImage),
        imageUrls: [r.colorFrontImage, r.colorBackImage, r.colorSideImage]
          .map(ssImageUrl)
          .filter((u): u is string => Boolean(u)),
        colorOptions: [],
        sizeOptions: [],
        variants: [],
        inventoryTotal: 0,
        _seenSkus: new Set(),
        _colorImages: {},
      }
      byStyle.set(styleKey, agg)
    }
    if (r.colorName && !agg.colorOptions!.includes(r.colorName)) agg.colorOptions!.push(r.colorName)
    if (r.colorName && r.colorFrontImage && !agg._colorImages[r.colorName]) {
      const u = ssImageUrl(r.colorFrontImage)
      if (u) agg._colorImages[r.colorName] = u
    }
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
  return Array.from(byStyle.values()).map(({ _seenSkus: _u, _colorImages, ...rest }) => {
    void _u
    return { ...rest, attributes: { ...(rest.attributes ?? {}), colorImages: _colorImages } }
  })
}

function priceToCents(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.round(value * 100)
}

/** S&S image fields are relative paths (e.g. "Images/Color/..._fm.jpg"); prefix
 *  with the S&S CDN so they render. Passes through already-absolute URLs. */
function ssImageUrl(path: string | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return `https://cdn.ssactivewear.com/${path.replace(/^\/+/, '')}`
}
