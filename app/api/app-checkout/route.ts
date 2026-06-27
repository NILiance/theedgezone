import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { platformFee } from '@/lib/stripe-connect'
import { resolveCommerce } from '@/lib/app-commerce'

/**
 * Public checkout for a product in a talent's live app (/a/[id]).
 * POST { app_id, product_id, quantity? } → { url } (Stripe Checkout).
 * The charge is a destination charge to the talent's Connect account with a
 * platform fee; the webhook (kind=app_product) marks the order paid.
 */
const schema = z.object({
  app_id: z.string().uuid(),
  product_id: z.string().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
})

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 })
  const supabase = createServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Server unavailable.' }, { status: 503 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]!.message }, { status: 400 })
  const { app_id, product_id, quantity } = parsed.data

  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, name, user_id, settings')
    .eq('id', app_id)
    .maybeSingle()
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 })

  const commerce = resolveCommerce((app.settings as Record<string, unknown>)?.commerce)
  const product = commerce.products.find((p) => p.id === product_id && p.active !== false)
  if (!product) return NextResponse.json({ error: 'Product not available' }, { status: 404 })

  const unit = Math.round((parseFloat(product.price) || 0) * 100)
  if (unit < 50) return NextResponse.json({ error: 'This product can’t be purchased online.' }, { status: 400 })
  const amount = unit * quantity

  // The talent's Connect account → destination charge with platform fee.
  let destination: string | null = null
  if (app.user_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_charges_enabled')
      .eq('id', app.user_id)
      .maybeSingle()
    if (prof?.stripe_connect_account_id && prof.stripe_connect_charges_enabled) {
      destination = prof.stripe_connect_account_id
    }
  }

  const { data: order } = await supabase
    .from('app_product_orders')
    .insert({ app_id, product_id, product_name: product.name, quantity, amount_cents: amount, status: 'pending' })
    .select('id')
    .single()

  const origin = req.headers.get('origin') ?? new URL(req.url).origin
  const images = product.image && /\.(png|jpe?g|webp)(\?|$)/i.test(product.image) ? [product.image] : undefined
  const piData = destination
    ? { application_fee_amount: platformFee(amount), transfer_data: { destination } }
    : undefined

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity,
          price_data: {
            currency: 'usd',
            product_data: { name: product.name || 'Product', ...(images ? { images } : {}) },
            unit_amount: unit,
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ['US'] },
      success_url: `${origin}/a/${app_id}?paid=1`,
      cancel_url: `${origin}/a/${app_id}`,
      metadata: { kind: 'app_product', app_id, product_id, order_id: order?.id ?? '' },
      ...(piData ? { payment_intent_data: piData } : {}),
    })
    if (order?.id) {
      await supabase.from('app_product_orders').update({ stripe_session_id: session.id }).eq('id', order.id)
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Checkout error' }, { status: 500 })
  }
}
