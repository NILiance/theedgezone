import type {
  Supplier,
  SupplierProduct,
  SupplierSearchParams,
  SupplierTestResult,
} from './types'

/**
 * PromoStandards SOAP client (lightweight, hand-rolled XML).
 *
 * The PromoStandards spec defines a family of SOAP services:
 *   - Product Data (PDS)            — getProduct, getProductSellable
 *   - Inventory (Inv)               — getInventoryLevels
 *   - Order Status / Shipment       — (deferred)
 *
 * Each supplier publishes their own WSDL endpoint. We POST a SOAP
 * envelope and parse the response with a regex extractor (rather than
 * pulling in a SOAP client library) — this stays surgical and keeps
 * cold-start fast.
 *
 * Docs: https://promostandards.org/standards/
 */

interface PsCreds {
  productDataEndpoint?: string
  inventoryEndpoint?: string
  username: string
  password: string
}

export class PromoStandardsSupplier implements Supplier {
  code = 'promostandards'
  displayName = 'PromoStandards'
  private creds: PsCreds

  constructor(creds: PsCreds) {
    this.creds = creds
  }

  async test(): Promise<SupplierTestResult> {
    if (!this.creds.productDataEndpoint && !this.creds.inventoryEndpoint) {
      return { ok: false, message: 'No PromoStandards endpoint URLs configured' }
    }
    const url = this.creds.productDataEndpoint ?? this.creds.inventoryEndpoint!
    try {
      const res = await fetch(url, { method: 'GET' })
      // SOAP endpoints respond to GET with the WSDL or a 405; both confirm reachability.
      if (res.status === 200 || res.status === 405) {
        return { ok: true, message: `Reachable — HTTP ${res.status}` }
      }
      return { ok: false, message: `HTTP ${res.status}` }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Network error' }
    }
  }

  async search(_params: SupplierSearchParams): Promise<SupplierProduct[]> {
    // PromoStandards doesn't have a search endpoint — you query by known
    // product IDs. Discovery typically comes from a separate catalog feed.
    // Return empty until catalog ingestion is wired (future).
    return []
  }

  async getProduct(supplierSku: string): Promise<SupplierProduct | null> {
    if (!this.creds.productDataEndpoint) return null
    const envelope = buildSoapEnvelope({
      ns: 'http://www.promostandards.org/WSDL/ProductDataService/2.0.0/',
      operation: 'getProduct',
      body: `
        <ns:productId>${escapeXml(supplierSku)}</ns:productId>
        <ns:localizationCountry>US</ns:localizationCountry>
        <ns:localizationLanguage>en</ns:localizationLanguage>
        <ns:wsVersion>2.0.0</ns:wsVersion>
        <ns:id>${escapeXml(this.creds.username)}</ns:id>
        <ns:password>${escapeXml(this.creds.password)}</ns:password>
      `,
    })
    try {
      const res = await fetch(this.creds.productDataEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: '"getProduct"',
        },
        body: envelope,
      })
      if (!res.ok) return null
      const text = await res.text()
      return parsePsProduct(supplierSku, text)
    } catch {
      return null
    }
  }

  async getInventory(supplierSku: string, variantSku?: string) {
    if (!this.creds.inventoryEndpoint) return null
    const envelope = buildSoapEnvelope({
      ns: 'http://www.promostandards.org/WSDL/Inventory/2.0.0/',
      operation: 'getInventoryLevels',
      body: `
        <ns:productId>${escapeXml(supplierSku)}</ns:productId>
        ${
          variantSku
            ? `<ns:Filter><ns:partIdArray><ns:partId>${escapeXml(variantSku)}</ns:partId></ns:partIdArray></ns:Filter>`
            : ''
        }
        <ns:wsVersion>2.0.0</ns:wsVersion>
        <ns:id>${escapeXml(this.creds.username)}</ns:id>
        <ns:password>${escapeXml(this.creds.password)}</ns:password>
      `,
    })
    try {
      const res = await fetch(this.creds.inventoryEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: '"getInventoryLevels"',
        },
        body: envelope,
      })
      if (!res.ok) return null
      const text = await res.text()
      const match = text.match(/<quantityAvailable>([\d.]+)<\/quantityAvailable>/i)
      const qty = match ? Math.round(Number(match[1]) || 0) : 0
      return {
        supplierSku,
        variantSku,
        available: qty,
        fetchedAt: new Date().toISOString(),
      }
    } catch {
      return null
    }
  }
}

function buildSoapEnvelope({
  ns,
  operation,
  body,
}: {
  ns: string
  operation: string
  body: string
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="${ns}">
  <soapenv:Header/>
  <soapenv:Body>
    <ns:${operation}Request>
      ${body}
    </ns:${operation}Request>
  </soapenv:Body>
</soapenv:Envelope>`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function parsePsProduct(productId: string, xml: string): SupplierProduct | null {
  const get = (tag: string): string | undefined => {
    const m = xml.match(new RegExp(`<(?:[a-z0-9]+:)?${tag}>([^<]+)</(?:[a-z0-9]+:)?${tag}>`, 'i'))
    return m ? m[1] : undefined
  }
  const name = get('productName') ?? get('name')
  if (!name) return null
  const description = get('description') ?? get('productDescription')
  const brand = get('productBrand') ?? get('brand')
  return {
    supplierSku: productId,
    name,
    description,
    brand,
    basePriceCents: 0,
    currency: 'usd',
    primaryImageUrl: get('mediaContent'),
    imageUrls: Array.from(xml.matchAll(/<mediaContent>([^<]+)<\/mediaContent>/gi)).map((m) => m[1]),
    colorOptions: Array.from(xml.matchAll(/<colorName>([^<]+)<\/colorName>/gi)).map((m) => m[1]),
    sizeOptions: Array.from(xml.matchAll(/<labelSize>([^<]+)<\/labelSize>/gi)).map((m) => m[1]),
  }
}
