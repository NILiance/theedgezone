import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { provisionOrder } from '@/lib/provisioning'

export const runtime = 'nodejs' // raw body needed for signature verification

/**
 * Stripe webhook handler.
 *
 * Verifies signature, deduplicates by event ID (writes to stripe_events),
 * handles checkout.session.completed by inserting an order row.
 *
 * Endpoint URL: POST /api/webhooks/stripe
 * Configure in Stripe Dashboard → Developers → Webhooks → Add endpoint.
 * Events to send: checkout.session.completed, checkout.session.async_payment_succeeded,
 *                 charge.refunded, invoice.paid (for subs), customer.subscription.deleted.
 */
export async function POST(request: Request) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe not configured — set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET.' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Invalid signature: ${msg}` },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server cannot reach Supabase — SUPABASE_SERVICE_ROLE_KEY missing.' },
      { status: 503 }
    )
  }

  // Idempotency
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id, processed_at')
    .eq('id', event.id)
    .maybeSingle()

  if (existing?.processed_at) {
    return NextResponse.json({ received: true, idempotent: true })
  }

  // Log on first sight (insert) or no-op if already logged
  if (!existing) {
    await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await supabase
          .from('orders')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent', charge.payment_intent as string)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        // Mark linked orders as cancelled (we don't store subscription id yet, but track via metadata)
        if (typeof sub.metadata?.user_id === 'string') {
          await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('user_id', sub.metadata.user_id)
            .eq('product_slug', sub.metadata.product_slug ?? '')
        }
        break
      }
      default:
        // Ignore unknown events but still mark processed below
        break
    }

    await supabase
      .from('stripe_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', event.id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await supabase
      .from('stripe_events')
      .update({ processing_error: msg })
      .eq('id', event.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata ?? {}
  const userId = metadata.user_id
  const productSlug = metadata.product_slug
  const productTitle = metadata.product_title
  if (!userId || !productSlug || !productTitle) return

  // Skip if we already wrote this session
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()
  if (existingOrder) return

  const { data: inserted } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      product_slug: productSlug,
      product_title: productTitle,
      plan: metadata.plan ?? 'onetime',
      amount_cents: session.amount_total ?? null,
      currency: session.currency ?? 'usd',
      status: 'provisioning',
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
      purchased_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (!inserted) return

  // Auto-provision the matching module row (sites for personal-website,
  // brand_designs for brand design, etc.) so My Products links to the
  // real entity rather than an empty index.
  try {
    const result = await provisionOrder(supabase, {
      id: inserted.id as string,
      user_id: userId,
      product_slug: productSlug,
    })
    await supabase
      .from('orders')
      .update({
        status: result.status,
        provisioned_entity_id: result.entity_id ?? null,
        provisioned_at: result.entity_id ? new Date().toISOString() : null,
      })
      .eq('id', inserted.id as string)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown provisioning error'
    await supabase
      .from('orders')
      .update({ status: 'provisioning' })
      .eq('id', inserted.id as string)
    console.error('[stripe-webhook] provisioning failed', errMsg)
  }
}
