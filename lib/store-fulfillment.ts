/**
 * NIL Stores — fulfillment dispatch.
 *
 * Called after an order is marked paid. Tries to auto-submit the order to the
 * product's supplier (adapters that implement submitOrder); anything without a
 * wired order API routes to manual fulfillment. Either way the store owner is
 * notified so paid orders never silently dead-end.
 */
import type { createServiceClient } from '@/lib/supabase/server'
import { getSupplier } from '@/lib/suppliers'
import { sendEmail } from '@/lib/resend'

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>

export interface DispatchResult {
  fulfillmentStatus: string
  supplierOrderId?: string | null
  message?: string
}

export async function dispatchStoreOrder(
  supabase: ServiceClient,
  orderId: string
): Promise<DispatchResult> {
  const { data: order } = await supabase
    .from('store_orders')
    .select(
      'id, store_id, product_id, variant_sku, quantity, buyer_name, buyer_email, shipping_address, fulfillment_status'
    )
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return { fulfillmentStatus: 'unfulfilled', message: 'Order not found' }
  // Don't re-dispatch an order already handed off or shipped.
  const current = (order as { fulfillment_status?: string }).fulfillment_status ?? 'unfulfilled'
  if (['submitted', 'shipped', 'delivered'].includes(current)) {
    return { fulfillmentStatus: current }
  }

  const [{ data: product }, { data: store }] = await Promise.all([
    order.product_id
      ? supabase
          .from('store_products')
          .select('name, supplier, supplier_sku')
          .eq('id', order.product_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('stores')
      .select('name, user_id, contact_email')
      .eq('id', order.store_id)
      .maybeSingle(),
  ])

  let fulfillmentStatus = 'manual'
  let supplierOrderId: string | null = null
  let fulfillmentError: string | null = null

  const supplierCode = (product as { supplier?: string | null } | null)?.supplier ?? null
  const supplierSku = (product as { supplier_sku?: string | null } | null)?.supplier_sku ?? null

  if (supplierCode && supplierSku) {
    try {
      const res = await getSupplier(supplierCode)
      if (res.ok && typeof res.supplier.submitOrder === 'function') {
        const out = await res.supplier.submitOrder({
          lines: [
            {
              supplierSku,
              variantSku: order.variant_sku ?? undefined,
              quantity: order.quantity ?? 1,
            },
          ],
          shipTo: {
            name: order.buyer_name ?? undefined,
            email: order.buyer_email ?? undefined,
            address: (order.shipping_address as Record<string, unknown> | null) ?? null,
          },
          reference: order.id,
        })
        if (out.status === 'submitted') {
          fulfillmentStatus = 'submitted'
          supplierOrderId = out.supplierOrderId ?? null
        } else if (out.status === 'failed') {
          fulfillmentStatus = 'failed'
          fulfillmentError = out.message ?? 'Supplier rejected the order'
        }
        // 'unsupported' → leave as manual
      } else if (!res.ok) {
        fulfillmentError = res.error // supplier not configured — manual
      }
    } catch (err) {
      fulfillmentStatus = 'failed'
      fulfillmentError = err instanceof Error ? err.message : 'Fulfillment error'
    }
  }

  await supabase
    .from('store_orders')
    .update({
      fulfillment_status: fulfillmentStatus,
      supplier_order_id: supplierOrderId,
      fulfillment_error: fulfillmentError,
    })
    .eq('id', orderId)

  // Notify the owner (best-effort, non-blocking).
  await notifyOwner(supabase, {
    store: store as { name?: string; user_id?: string; contact_email?: string | null } | null,
    productName: (product as { name?: string } | null)?.name ?? 'an item',
    order,
    fulfillmentStatus,
    fulfillmentError,
  })

  return { fulfillmentStatus, supplierOrderId, message: fulfillmentError ?? undefined }
}

async function notifyOwner(
  supabase: ServiceClient,
  args: {
    store: { name?: string; user_id?: string; contact_email?: string | null } | null
    productName: string
    order: { id: string; store_id: string; variant_sku?: string | null; quantity?: number | null }
    fulfillmentStatus: string
    fulfillmentError: string | null
  }
) {
  let to = args.store?.contact_email ?? null
  if (!to && args.store?.user_id) {
    try {
      const { data } = await supabase.auth.admin.getUserById(args.store.user_id)
      to = data.user?.email ?? null
    } catch {
      /* fall through — no email */
    }
  }
  if (!to) return

  const storeName = args.store?.name ?? 'Your store'
  const headline =
    args.fulfillmentStatus === 'submitted'
      ? 'Order auto-submitted to your supplier'
      : args.fulfillmentStatus === 'failed'
        ? 'Order needs attention — auto-fulfillment failed'
        : 'New order to fulfill'
  void sendEmail({
    to,
    subject: `${storeName}: ${headline}`,
    templateKey: 'store_order_fulfillment',
    html: `<p>You have a paid order for <strong>${args.productName}</strong>${
      args.order.variant_sku ? ` (${args.order.variant_sku})` : ''
    } ×${args.order.quantity ?? 1}.</p>
<p>Fulfillment status: <strong>${args.fulfillmentStatus}</strong>${
      args.fulfillmentError ? ` — ${args.fulfillmentError}` : ''
    }.</p>
<p>Manage it in your dashboard under Stores → Orders.</p>`,
    metadata: {
      order_id: args.order.id,
      store_id: args.order.store_id,
      fulfillment_status: args.fulfillmentStatus,
    },
  })
}
