import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { platformFee } from '@/lib/stripe-connect'

/**
 * Public store checkout endpoint. Creates a Stripe Checkout Session for a
 * single-product purchase, returns the hosted URL.
 *
 * POST /api/store-checkout
 * Body: { store_id, product_id, buyer_email, buyer_name? }
 */
const bodySchema = z.object({
  store_id: z.string().uuid(),
  product_id: z.string().uuid(),
  buyer_email: z.string().email().max(160),
  buyer_name: z.string().max(120).optional(),
  variant_sku: z.string().max(120).optional(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
})

interface StoreVariant {
  size?: string
  color?: string
  sku?: string
  price_cents?: number | null
  inventory?: number | null
}

function variantLabel(v: StoreVariant): string {
  return [v.size, v.color].filter(Boolean).join(' / ') || v.sku || ''
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]!.message }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('id, slug, name, user_id, commission_bps, status')
    .eq('id', parsed.data.store_id)
    .single()
  if (!store || store.status !== 'open') {
    return NextResponse.json({ error: 'Store not available' }, { status: 404 })
  }

  const { data: product } = await supabase
    .from('store_products')
    .select(
      'id, name, description, price_cents, cost_cents, currency, primary_image_url, active, inventory, variants'
    )
    .eq('id', parsed.data.product_id)
    .eq('store_id', store.id)
    .single()
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Product unavailable' }, { status: 404 })
  }

  // Resolve the chosen variant (if any) for price, cost, label, stock.
  const variants: StoreVariant[] = Array.isArray(
    (product as { variants?: unknown }).variants
  )
    ? ((product as { variants: StoreVariant[] }).variants)
    : []
  let variant: StoreVariant | null = null
  if (parsed.data.variant_sku) {
    variant = variants.find((v) => v.sku === parsed.data.variant_sku) ?? null
    if (!variant) {
      return NextResponse.json({ error: 'Selected option is unavailable.' }, { status: 404 })
    }
  } else if (variants.length > 0) {
    variant = variants[0]!
  }

  const qty = parsed.data.quantity
  const unitPrice = variant?.price_cents ?? product.price_cents
  // Cost is product-level (supplier COGS); snapshot per unit for payouts.
  const unitCost = (product as { cost_cents?: number | null }).cost_cents ?? null
  const amount = unitPrice * qty

  // Stock checks — variant stock takes precedence over product stock.
  const stock =
    variant && typeof variant.inventory === 'number'
      ? variant.inventory
      : typeof product.inventory === 'number'
        ? product.inventory
        : null
  if (typeof stock === 'number' && stock < qty) {
    return NextResponse.json({ error: 'Not enough stock for that quantity.' }, { status: 409 })
  }
  const variantText = variant ? variantLabel(variant) : null

  // Owner Connect routing — re-uses the same Stripe Connect setup the
  // site builder uses for tip jar / merch / etc.
  let destinationAccount: string | null = null
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_charges_enabled')
    .eq('id', store.user_id)
    .maybeSingle()
  if (
    ownerProfile?.stripe_connect_account_id &&
    ownerProfile.stripe_connect_charges_enabled
  ) {
    destinationAccount = ownerProfile.stripe_connect_account_id
  }

  // Platform fee — taken via Connect application_fee when the owner is
  // connected; snapshot it on the order for the earnings report.
  const feeBps = store.commission_bps ?? 1500
  const platformFeeCents = destinationAccount ? platformFee(amount, feeBps) : 0

  // Pre-insert the order row so the webhook has a target.
  const { data: order } = await supabase
    .from('store_orders')
    .insert({
      store_id: store.id,
      product_id: product.id,
      buyer_email: parsed.data.buyer_email,
      buyer_name: parsed.data.buyer_name ?? null,
      amount_cents: amount,
      unit_price_cents: unitPrice,
      cost_cents: unitCost,
      platform_fee_cents: platformFeeCents,
      quantity: qty,
      variant_sku: variant?.sku ?? null,
      variant_label: variantText,
      currency: product.currency,
      status: 'pending',
    })
    .select('id')
    .single()

  const origin = request.headers.get('origin') ?? new URL(request.url).origin
  const successUrl = `${origin}/store/${store.slug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${origin}/store/${store.slug}`

  const paymentIntentData: Record<string, unknown> = {}
  if (destinationAccount) {
    paymentIntentData.application_fee_amount = platformFeeCents
    paymentIntentData.transfer_data = { destination: destinationAccount }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: qty,
          price_data: {
            currency: product.currency,
            product_data: {
              name: variantText ? `${product.name} — ${variantText}` : product.name,
              description: product.description ?? undefined,
              images: product.primary_image_url ? [product.primary_image_url] : undefined,
            },
            unit_amount: unitPrice,
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU'] },
      customer_email: parsed.data.buyer_email,
      payment_intent_data: paymentIntentData as import('stripe').Stripe.Checkout.SessionCreateParams.PaymentIntentData,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        kind: 'store_merch',
        store_id: store.id,
        store_slug: store.slug,
        product_id: product.id,
        order_id: order?.id ?? '',
        variant_sku: variant?.sku ?? '',
        quantity: String(qty),
      },
    })

    if (order?.id) {
      await supabase
        .from('store_orders')
        .update({ stripe_session_id: session.id })
        .eq('id', order.id)
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
