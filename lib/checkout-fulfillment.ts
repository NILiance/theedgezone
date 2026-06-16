/**
 * Synchronous fallback for the Stripe webhook's order provisioning.
 *
 * The webhook (app/api/webhooks/stripe/route.ts) is the source of truth
 * for paid orders — but it's async and can lag a few seconds. When the
 * talent lands on /dashboard?checkout=success&session_id=... right after
 * paying, the order row often doesn't exist yet and the entitlement card
 * is missing. Refreshing eventually shows it.
 *
 * To close that gap we call fulfillCheckoutSession from the dashboard
 * page server component. It looks up the Stripe session, checks if the
 * order already landed, and if not creates the order + provisions the
 * matching module row. Idempotent — re-runs after the webhook also fires
 * are no-ops thanks to the stripe_session_id uniqueness check.
 *
 * Only handles the "regular catalog purchase" path. site_, store_,
 * bd_* metadata kinds (anonymous fan purchases, brand-design extras)
 * are intentionally skipped — those flows manage their own success URLs
 * and don't surface on the talent dashboard.
 */
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { provisionOrder } from '@/lib/provisioning'

export type FulfillResult =
  | { ok: true; alreadyExisted: boolean; orderId?: string }
  | { ok: false; reason: string }

export async function fulfillCheckoutSession(
  sessionId: string,
  expectedUserId: string
): Promise<FulfillResult> {
  if (!stripe) return { ok: false, reason: 'Stripe not configured.' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, reason: 'Service role key missing.' }

  // Fast path: order already landed via webhook.
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()
  if (existing) {
    return { ok: true, alreadyExisted: true, orderId: existing.id as string }
  }

  // Pull the session from Stripe — we need the metadata + payment status.
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Could not load Stripe session.',
    }
  }

  // Only run for paid sessions — async payment flows still need the
  // webhook to fire later.
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { ok: false, reason: `Session not paid yet (${session.payment_status}).` }
  }

  const md = session.metadata ?? {}
  const userId = md.user_id
  const productSlug = md.product_slug
  const productTitle = md.product_title

  // Validate the session actually belongs to the dashboard's current user.
  // Without this anyone could trigger fulfilment for another user's
  // session by pasting the session_id into their URL.
  if (!userId || userId !== expectedUserId) {
    return { ok: false, reason: 'Session does not belong to this user.' }
  }
  if (!productSlug || !productTitle) {
    // Anonymous / site_ / store_ / bd_extras flows. Webhook handles them.
    return { ok: false, reason: 'Non-catalog session — webhook will handle.' }
  }

  // Insert the order in provisioning state, same shape the webhook uses.
  const { data: inserted, error: insertErr } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      product_slug: productSlug,
      product_title: productTitle,
      plan: md.plan ?? 'onetime',
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
  if (insertErr || !inserted) {
    // Race with the webhook is fine — re-check existence then bail.
    const { data: postRaceExisting } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()
    if (postRaceExisting) {
      return { ok: true, alreadyExisted: true, orderId: postRaceExisting.id as string }
    }
    return {
      ok: false,
      reason: insertErr?.message ?? 'Failed to create order row.',
    }
  }

  // Provision the matching module row (sites / brand_designs / epks / …)
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
    console.error('[checkout-fulfillment] provisioning failed', err)
    // Leave the order in provisioning state — webhook will retry.
  }

  return { ok: true, alreadyExisted: false, orderId: inserted.id as string }
}
