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
})

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
    .select('id, name, description, price_cents, currency, primary_image_url, active, inventory')
    .eq('id', parsed.data.product_id)
    .eq('store_id', store.id)
    .single()
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Product unavailable' }, { status: 404 })
  }
  if (typeof product.inventory === 'number' && product.inventory <= 0) {
    return NextResponse.json({ error: 'Out of stock' }, { status: 409 })
  }

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

  // Pre-insert the order row so the webhook has a target.
  const { data: order } = await supabase
    .from('store_orders')
    .insert({
      store_id: store.id,
      product_id: product.id,
      buyer_email: parsed.data.buyer_email,
      buyer_name: parsed.data.buyer_name ?? null,
      amount_cents: product.price_cents,
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
    const feeBps = store.commission_bps ?? 1500
    paymentIntentData.application_fee_amount = platformFee(product.price_cents, feeBps)
    paymentIntentData.transfer_data = { destination: destinationAccount }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description ?? undefined,
              images: product.primary_image_url ? [product.primary_image_url] : undefined,
            },
            unit_amount: product.price_cents,
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
