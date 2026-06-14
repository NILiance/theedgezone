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
        await supabase
          .from('site_transactions')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent', charge.payment_intent as string)
        break
      }
      case 'account.updated': {
        // Connect account status changed (KYC pass, restrictions, etc.)
        const acc = event.data.object as Stripe.Account
        const due = (acc.requirements?.currently_due?.length ?? 0) + (acc.requirements?.past_due?.length ?? 0)
        let status: string = 'pending'
        if (acc.charges_enabled && acc.payouts_enabled) status = 'active'
        else if (acc.requirements?.disabled_reason) status = 'disabled'
        else if (due > 0) status = 'restricted'
        await supabase
          .from('profiles')
          .update({
            stripe_connect_status: status,
            stripe_connect_charges_enabled: Boolean(acc.charges_enabled),
            stripe_connect_payouts_enabled: Boolean(acc.payouts_enabled),
            stripe_connect_details_submitted: Boolean(acc.details_submitted),
            stripe_connect_onboarded_at: status === 'active' ? new Date().toISOString() : null,
          })
          .eq('stripe_connect_account_id', acc.id)
        break
      }
      case 'payout.created':
      case 'payout.paid':
      case 'payout.failed':
      case 'payout.canceled': {
        const payout = event.data.object as Stripe.Payout
        // The Stripe event for connected accounts includes the account
        // in event.account; for platform payouts it's absent.
        const accountId = event.account
        if (!accountId) break

        // Resolve the user from the Connect account ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_connect_account_id', accountId)
          .maybeSingle()
        if (!profile) break

        const status =
          event.type === 'payout.paid'
            ? 'paid'
            : event.type === 'payout.failed'
            ? 'failed'
            : event.type === 'payout.canceled'
            ? 'cancelled'
            : payout.status ?? 'pending'

        await supabase.from('talent_payouts').upsert(
          {
            user_id: profile.id,
            stripe_payout_id: payout.id,
            stripe_account_id: accountId,
            amount_cents: payout.amount,
            currency: payout.currency,
            status,
            arrival_date: payout.arrival_date
              ? new Date(payout.arrival_date * 1000).toISOString()
              : null,
            failure_message: payout.failure_message ?? null,
          },
          { onConflict: 'stripe_payout_id' }
        )
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
        // Public-site tier subscription cancelled — mark the matching
        // site_transactions row.
        await supabase
          .from('site_transactions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id)
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

  // Public-site purchase (tip_jar, merch, shoutout, membership tier).
  // These come from /api/site-checkout and never have a user_id — the
  // buyer is anonymous to the platform. Stamp the matching
  // site_transactions row as paid; subscription kinds also store the
  // sub id so the cancellation webhook can match.
  if (typeof metadata.kind === 'string' && metadata.kind.startsWith('site_')) {
    await handleSiteCheckoutCompleted(supabase, session)
    return
  }

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

/**
 * Public-site checkout (tip_jar, merch, shoutout, membership tier).
 * Promotes site_transactions to paid, stamps payment intent / subscription
 * IDs, and (for affiliates) bumps the credited affiliate counters.
 */
async function handleSiteCheckoutCompleted(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata ?? {}
  const transactionId = typeof metadata.transaction_id === 'string' ? metadata.transaction_id : ''
  if (!transactionId) return

  const paymentIntent =
    typeof session.payment_intent === 'string' ? session.payment_intent : null
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null
  const customerId = typeof session.customer === 'string' ? session.customer : null

  const { data: existing } = await supabase
    .from('site_transactions')
    .select('id, status, affiliate_code, site_id, amount_cents')
    .eq('id', transactionId)
    .maybeSingle()
  if (!existing || existing.status === 'paid') return

  await supabase
    .from('site_transactions')
    .update({
      status: 'paid',
      stripe_payment_intent: paymentIntent,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (existing.affiliate_code) {
    const { data: affiliate } = await supabase
      .from('site_affiliates')
      .select('id, lifetime_revenue_cents, signups')
      .eq('site_id', existing.site_id)
      .eq('code', existing.affiliate_code)
      .maybeSingle()
    if (affiliate) {
      await supabase
        .from('site_affiliates')
        .update({
          lifetime_revenue_cents:
            (affiliate.lifetime_revenue_cents ?? 0) + (existing.amount_cents ?? 0),
          signups: (affiliate.signups ?? 0) + 1,
        })
        .eq('id', affiliate.id)
    }
  }
}
