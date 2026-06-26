import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { provisionOrder } from '@/lib/provisioning'
import { dispatchStoreOrder } from '@/lib/store-fulfillment'
import { sendEmail } from '@/lib/resend'

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

  // NIL Store merch purchase — promotes the matching store_orders row.
  if (metadata.kind === 'store_merch') {
    await handleStoreOrderCompleted(supabase, session)
    return
  }

  // Podcast premium subscription — mint a private feed token + email it.
  if (metadata.kind === 'podcast_sub') {
    await handlePodcastSubscription(supabase, session)
    return
  }

  // Brand-design extras — additional brand purchase or paid revision.
  if (metadata.kind === 'bd_additional') {
    await handleBrandDesignAdditional(supabase, session)
    return
  }
  if (metadata.kind === 'bd_revision') {
    await handleBrandDesignRevision(supabase, session)
    return
  }
  if (metadata.kind === 'bd_additional_final') {
    await handleBrandDesignAdditionalFinal(supabase, session)
    return
  }
  if (metadata.kind === 'bd_concept_pack') {
    const userId = metadata.user_id
    const brandId = metadata.brand_id
    if (userId && brandId) {
      const { applyConceptPackPurchase } = await import('@/lib/checkout-fulfillment')
      await applyConceptPackPurchase({
        supabase,
        userId,
        brandId,
        sessionId: session.id,
        packSize: parseInt(metadata.pack_size ?? '10', 10) || 10,
        amountCents: session.amount_total ?? null,
      })
    }
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

  // Post-purchase "fill profile" email. Fire-and-forget so it doesn't
  // affect provisioning or the webhook 200 response.
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
    const { data: userRes } = await supabase.auth.admin.getUserById(userId)
    const email = userRes?.user?.email
    if (email) {
      const { postPurchaseEmail } = await import('@/lib/emails/post-purchase')
      const { sendEmail } = await import('@/lib/resend')
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.com'
      const tpl = postPurchaseEmail({
        displayName: profile?.display_name ?? null,
        productTitle: productSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        productSlug,
        siteUrl,
      })
      void sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        templateKey: 'post_purchase',
        metadata: { user_id: userId, order_id: inserted.id, product_slug: productSlug },
      })
    }
  } catch (err) {
    console.error('[stripe-webhook] post-purchase email failed', err)
  }
}

/**
 * Brand-design "additional logo" purchase completed — spin up a new
 * brand_designs row owned by the talent. The talent's first BD is
 * provisioned through provisionOrder + the catalog product; this one
 * is a self-serve add-on so we bypass orders entirely.
 */
async function handleBrandDesignAdditional(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata ?? {}
  const userId = metadata.user_id
  if (!userId) return

  // Idempotency — skip if we've already created a brand_design for this
  // Stripe session.
  const { data: existing } = await supabase
    .from('brand_designs')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()
  if (existing) return

  const { provisionBrandDesign } = await import('@/lib/provisioning')
  const result = await provisionBrandDesign(supabase, userId, undefined, {
    fromProfile: true,
  })
  if (result.entity_id) {
    await supabase
      .from('brand_designs')
      .update({ stripe_session_id: session.id })
      .eq('id', result.entity_id)
  }
}

/**
 * Paid revision purchase completed — append a brand_design_revisions
 * row pulled from the session metadata.
 */
async function handleBrandDesignRevision(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata ?? {}
  const userId = metadata.user_id
  const brandId = metadata.brand_id
  if (!userId || !brandId) return

  // Idempotency on the Stripe session id.
  const { data: existing } = await supabase
    .from('brand_design_revisions')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()
  if (existing) return

  await supabase.from('brand_design_revisions').insert({
    brand_design_id: brandId,
    user_id: userId,
    notes: typeof metadata.notes === 'string' ? metadata.notes : null,
    source: 'paid',
    amount_cents: session.amount_total ?? 0,
    status: 'pending',
    stripe_session_id: session.id,
  })
}

/**
 * Promote a non-selected concept into a paid additional final by cloning
 * the parent brand_designs into a new row with that concept as the
 * final logo, then auto-assembling that new brand's kit. Each final
 * ends up with its own brand row + its own kit — same model the legacy
 * "YOUR LOGOS:" switcher uses. Idempotent via stripe_session_id on the
 * new brand row.
 */
async function handleBrandDesignAdditionalFinal(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata ?? {}
  const userId = metadata.user_id
  const parentBrandId = metadata.brand_id
  const conceptId = metadata.concept_id
  if (!userId || !parentBrandId || !conceptId) return

  // Idempotency — if the clone already exists, do nothing.
  const { data: existing } = await supabase
    .from('brand_designs')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()
  if (existing) return

  const { cloneBrandForAdditionalFinal } = await import('@/lib/checkout-fulfillment')
  await cloneBrandForAdditionalFinal({
    supabase,
    userId,
    parentBrandId,
    conceptId,
    sessionId: session.id,
  })
}

/**
 * NIL Store merch checkout completed. Stamps the order row with the
 * payment intent and decrements inventory if tracked.
 */
async function handleStoreOrderCompleted(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata ?? {}
  const orderId = typeof metadata.order_id === 'string' ? metadata.order_id : ''
  if (!orderId) return
  const paymentIntent =
    typeof session.payment_intent === 'string' ? session.payment_intent : null
  const shippingDetails =
    (session as unknown as { shipping_details?: unknown }).shipping_details ?? null

  const { data: existing } = await supabase
    .from('store_orders')
    .select('id, status, product_id, quantity, variant_sku')
    .eq('id', orderId)
    .maybeSingle()
  if (!existing || existing.status === 'paid' || existing.status === 'fulfilled') return

  await supabase
    .from('store_orders')
    .update({
      status: 'paid',
      stripe_payment_intent: paymentIntent,
      paid_at: new Date().toISOString(),
      shipping_address: shippingDetails as unknown as Record<string, unknown>,
    })
    .eq('id', orderId)

  // Decrement inventory if tracked — quantity- and variant-aware.
  const qty = Math.max(1, Number((existing as { quantity?: number }).quantity ?? 1))
  const variantSku = (existing as { variant_sku?: string | null }).variant_sku ?? null
  if (existing.product_id) {
    const { data: prod } = await supabase
      .from('store_products')
      .select('inventory, variants')
      .eq('id', existing.product_id)
      .maybeSingle()
    if (prod) {
      const patch: Record<string, unknown> = {}
      if (typeof prod.inventory === 'number') {
        patch.inventory = Math.max(0, prod.inventory - qty)
      }
      // Decrement the matching variant's stock inside the jsonb array.
      if (variantSku && Array.isArray((prod as { variants?: unknown }).variants)) {
        const variants = (prod as { variants: Array<Record<string, unknown>> }).variants
        const next = variants.map((v) =>
          v.sku === variantSku && typeof v.inventory === 'number'
            ? { ...v, inventory: Math.max(0, (v.inventory as number) - qty) }
            : v
        )
        patch.variants = next
      }
      if (Object.keys(patch).length > 0) {
        await supabase.from('store_products').update(patch).eq('id', existing.product_id)
      }
    }
  }

  // Dispatch fulfillment (auto-submit to supplier or route to manual + notify).
  try {
    await dispatchStoreOrder(supabase, orderId)
  } catch {
    // Best-effort — the order is already paid; owner can retry from the dashboard.
  }
}

async function handlePodcastSubscription(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  session: Stripe.Checkout.Session
) {
  const md = session.metadata ?? {}
  const podcastId = typeof md.podcast_id === 'string' ? md.podcast_id : ''
  const email =
    (typeof md.subscriber_email === 'string' ? md.subscriber_email : '') ||
    session.customer_details?.email ||
    ''
  if (!podcastId || !email) return
  const subId = typeof session.subscription === 'string' ? session.subscription : null
  const customerId = typeof session.customer === 'string' ? session.customer : null

  // Idempotent on the Stripe subscription id.
  if (subId) {
    const { data: existing } = await supabase
      .from('podcast_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subId)
      .maybeSingle()
    if (existing) return
  }

  const token = randomUUID().replace(/-/g, '')
  await supabase.from('podcast_subscriptions').insert({
    podcast_id: podcastId,
    subscriber_email: email,
    feed_token: token,
    stripe_subscription_id: subId,
    stripe_customer_id: customerId,
    status: 'active',
  })

  const { data: pod } = await supabase
    .from('podcasts')
    .select('slug, title')
    .eq('id', podcastId)
    .maybeSingle()
  const slug = (pod as { slug?: string } | null)?.slug
  if (slug) {
    const site = env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.com'
    const feedUrl = `${site}/podcasts/${slug}/private/${token}/feed.xml`
    void sendEmail({
      to: email,
      subject: `Your private feed for ${(pod as { title?: string } | null)?.title ?? 'the show'}`,
      templateKey: 'podcast_private_feed',
      html: `<p>Thanks for subscribing!</p>
<p>Add this private feed URL to your podcast app to unlock premium episodes:</p>
<p><a href="${feedUrl}">${feedUrl}</a></p>
<p>Keep it to yourself — it's unique to you.</p>`,
      metadata: { podcast_id: podcastId },
    })
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
