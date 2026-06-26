import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTradingCardTiers, makeOrderNumber } from '@/lib/trading-cards'

export const runtime = 'nodejs'

/**
 * Embedded Stripe checkout for a printed trading-card order.
 *
 * The talent picks one of their generated cards + a quantity tier, we
 * pre-insert a `trading_card_orders` row (status pending), then open an
 * embedded checkout that collects the shipping address. The webhook
 * (`kind: 'trading_card'`) flips the row to paid, stores the address, and
 * emails the proof-before-printing confirmation. Payment lands on the
 * platform account — Edge Zone prints + ships, so there's no Connect routing.
 *
 * POST body: { brand_id, addon_id, qty }
 */
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  }

  let body: { brand_id?: string; addon_id?: string; qty?: number; notes?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (!body.brand_id || !body.addon_id || !body.qty) {
    return NextResponse.json({ error: 'Pick a card and a quantity.' }, { status: 400 })
  }

  const supabase = await createClient()

  // Ownership: the brand must belong to the signed-in talent.
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, user_id, brand_name')
    .eq('id', body.brand_id)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) {
    return NextResponse.json({ error: 'Brand design not found.' }, { status: 404 })
  }

  // The card must be one of this brand's generated trading cards.
  const { data: card } = await supabase
    .from('brand_design_addons')
    .select('id, url, kind, metadata, brand_design_id')
    .eq('id', body.addon_id)
    .eq('brand_design_id', brand.id)
    .maybeSingle()
  if (!card || card.kind !== 'trading_card' || !card.url) {
    return NextResponse.json({ error: 'Select one of your generated cards.' }, { status: 404 })
  }
  const cardStyle =
    typeof (card.metadata as { style?: unknown } | null)?.style === 'string'
      ? ((card.metadata as { style?: string }).style as string)
      : null

  // Resolve the chosen tier by quantity (authoritative price from the DB).
  const tiers = await getTradingCardTiers(supabase)
  const tier = tiers.find((t) => t.qty === Number(body.qty))
  if (!tier) {
    return NextResponse.json({ error: 'That quantity is no longer available.' }, { status: 400 })
  }

  const orderNumber = makeOrderNumber()
  const notes = (body.notes ?? '').slice(0, 600) || null

  // Pre-insert the order row so the webhook + success page have a target.
  // Prefer service-role (bypasses RLS, reads id back cleanly); fall back to
  // the auth client which the owner-insert policy permits.
  const writer = createServiceClient() ?? supabase
  const { data: order, error: insertErr } = await writer
    .from('trading_card_orders')
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      brand_design_id: brand.id,
      addon_id: card.id,
      card_url: card.url,
      card_style: cardStyle,
      quantity: tier.qty,
      unit_label: tier.label,
      amount_cents: tier.price_cents,
      notes,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insertErr || !order) {
    return NextResponse.json(
      { error: insertErr?.message ?? 'Could not start the order.' },
      { status: 500 }
    )
  }

  const origin = new URL(request.url).origin
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Printed Trading Cards — ${tier.label}`,
              description:
                'Premium 2.5" x 3.5" trading cards on thick glossy card stock. We email a proof before printing; ships in 5–7 business days.',
              images: card.url ? [card.url] : undefined,
            },
            unit_amount: tier.price_cents,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      allow_promotion_codes: true,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU'] },
      return_url: `${origin}/dashboard/brand-design/${brand.id}?view=arsenal&arsenalsubtab=trading_card&tc_order=success&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        kind: 'trading_card',
        order_id: order.id as string,
        order_number: orderNumber,
        user_id: user.id,
        brand_id: brand.id,
        qty: String(tier.qty),
      },
    })

    await writer
      .from('trading_card_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id as string)

    return NextResponse.json({ client_secret: session.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    // Roll the pending order back so it doesn't linger if checkout never opened.
    await writer.from('trading_card_orders').delete().eq('id', order.id as string)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
