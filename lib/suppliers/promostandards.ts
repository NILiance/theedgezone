import type {
  Supplier,
  SupplierProduct,
  SupplierSearchParams,
  SupplierTestResult,
  SupplierOrderRequest,
  SupplierOrderResult,
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
  purchaseOrderEndpoint?: string
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

  /**
   * Order placement via the PromoStandards PurchaseOrder Service (SendPO 1.0.0).
   *
   * Opt-in (PS_AUTO_FULFILL=true) and requires a PurchaseOrder endpoint in the
   * supplier creds. The PO schema is large and supplier-specific, so this is a
   * best-effort blank-goods order: any SOAP fault / Error ServiceMessage is
   * returned as 'failed' with the fault text, so the dispatcher routes the
   * order to manual and surfaces the reason. PS_CARRIER / PS_SERVICE set the
   * ship method (omitted → supplier default).
   */
  async submitOrder(req: SupplierOrderRequest): Promise<SupplierOrderResult> {
    if (process.env.PS_AUTO_FULFILL !== 'true') {
      return {
        status: 'unsupported',
        message: 'PromoStandards auto-fulfill disabled (set PS_AUTO_FULFILL=true)',
      }
    }
    if (!this.creds.purchaseOrderEndpoint) {
      return { status: 'unsupported', message: 'No PromoStandards PurchaseOrder endpoint configured' }
    }
    const addr = normalizeAddress(req.shipTo.address)
    if (!addr) return { status: 'failed', message: 'Order has no usable shipping address' }

    const orderDate = new Date().toISOString().slice(0, 10)
    const customer = req.shipTo.name || addr.name || 'Customer'
    const carrier = process.env.PS_CARRIER
    const service = process.env.PS_SERVICE
    const shipmentDetailsXml =
      carrier || service
        ? `
              <ns:shipmentDetails>
                ${carrier ? `<ns:carrier>${escapeXml(carrier)}</ns:carrier>` : ''}
                ${service ? `<ns:service>${escapeXml(service)}</ns:service>` : ''}
              </ns:shipmentDetails>`
        : ''

    const lineItemsXml = req.lines
      .map((l, i) => {
        const part = l.variantSku || l.supplierSku
        return `
            <ns:LineItem>
              <ns:lineNumber>${i + 1}</ns:lineNumber>
              <ns:lineType>New</ns:lineType>
              <ns:description>${escapeXml(part)}</ns:description>
              <ns:allowExceptions>true</ns:allowExceptions>
              <ns:parts>
                <ns:Part>
                  <ns:partId>${escapeXml(part)}</ns:partId>
                  <ns:quantity>
                    <ns:value>${l.quantity}</ns:value>
                    <ns:uom>EA</ns:uom>
                  </ns:quantity>
                </ns:Part>
              </ns:parts>
            </ns:LineItem>`
      })
      .join('')

    const body = `
        <ns:wsVersion>1.0.0</ns:wsVersion>
        <ns:id>${escapeXml(this.creds.username)}</ns:id>
        <ns:password>${escapeXml(this.creds.password)}</ns:password>
        <ns:PO>
          <ns:orderType>Blank</ns:orderType>
          <ns:poNumber>${escapeXml(req.reference.slice(0, 30))}</ns:poNumber>
          <ns:orderDate>${orderDate}</ns:orderDate>
          <ns:rush><ns:isRush>false</ns:isRush></ns:rush>
          <ns:shipments>
            <ns:Shipment>
              <ns:shipmentId>1</ns:shipmentId>
              <ns:blindShip>false</ns:blindShip>
              <ns:packingListRequired>false</ns:packingListRequired>
              <ns:shipTo>
                <ns:shipToType>Customer</ns:shipToType>
                <ns:contactName>${escapeXml(customer)}</ns:contactName>
                <ns:companyName>${escapeXml(customer)}</ns:companyName>
                <ns:address1>${escapeXml(addr.address1)}</ns:address1>
                ${addr.address2 ? `<ns:address2>${escapeXml(addr.address2)}</ns:address2>` : ''}
                <ns:city>${escapeXml(addr.city)}</ns:city>
                <ns:region>${escapeXml(addr.state)}</ns:region>
                <ns:postalCode>${escapeXml(addr.zip)}</ns:postalCode>
                <ns:country>${escapeXml(addr.country || 'US')}</ns:country>
              </ns:shipTo>${shipmentDetailsXml}
            </ns:Shipment>
          </ns:shipments>
          <ns:lineItems>${lineItemsXml}
          </ns:lineItems>
        </ns:PO>`

    const envelope = buildSoapEnvelope({
      ns: 'http://www.promostandards.org/WSDL/PurchaseOrderService/1.0.0/',
      operation: 'SendPO',
      body,
    })

    try {
      const res = await fetch(this.creds.purchaseOrderEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '"SendPO"' },
        body: envelope,
      })
      const text = await res.text()
      if (!res.ok) {
        return {
          status: 'failed',
          message: `PromoStandards HTTP ${res.status}: ${stripTags(text).slice(0, 200)}`,
        }
      }
      const txId =
        text.match(/<(?:[a-z0-9]+:)?transactionId>([^<]+)<\/(?:[a-z0-9]+:)?transactionId>/i)?.[1]
      const fault =
        text.match(/<(?:[a-z0-9]+:)?faultstring>([^<]+)</i)?.[1] ??
        text.match(/<(?:[a-z0-9]+:)?description>([^<]+)</i)?.[1]
      const hasError = /<(?:[a-z0-9]+:)?severity>\s*Error\s*<\/(?:[a-z0-9]+:)?severity>/i.test(text)
      if ((hasError || !txId) && fault) {
        return { status: 'failed', message: `PromoStandards: ${fault.trim().slice(0, 200)}` }
      }
      return {
        status: 'submitted',
        supplierOrderId: txId ? txId.trim() : undefined,
        message: 'Submitted to PromoStandards (SendPO)',
      }
    } catch (err) {
      return {
        status: 'failed',
        message: err instanceof Error ? err.message : 'PromoStandards order request failed',
      }
    }
  }
}

function psStr(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Accepts a flat address or Stripe's shipping_details ({ name, address: {…} }). */
function normalizeAddress(
  raw: Record<string, unknown> | null | undefined
): { name?: string; address1: string; address2?: string; city: string; state: string; zip: string; country?: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const inner =
    raw.address && typeof raw.address === 'object'
      ? (raw.address as Record<string, unknown>)
      : raw
  const address1 = psStr(inner.line1) || psStr(inner.address1)
  const city = psStr(inner.city)
  const state = psStr(inner.state) || psStr(inner.region)
  const zip = psStr(inner.postal_code) || psStr(inner.zip) || psStr(inner.postalCode)
  if (!address1 || !city || !zip) return null
  return {
    name: psStr(raw.name) || psStr(inner.name) || undefined,
    address1,
    address2: psStr(inner.line2) || psStr(inner.address2) || undefined,
    city,
    state,
    zip,
    country: psStr(inner.country) || undefined,
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
