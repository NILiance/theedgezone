import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { platformFee } from '@/lib/stripe-connect'

/**
 * Public checkout-session endpoint for revenue blocks on a rendered site.
 *
 * POST /api/site-checkout
 * Body: { kind: 'tip' | 'merch' | 'shoutout' | 'tier', site_id, ...kind-specific }
 *
 * Returns { url } — the Stripe-hosted Checkout Session URL. The client
 * does window.location = url so Stripe handles cards, 3DS, Apple Pay
 * etc. for us.
 *
 * The webhook (app/api/webhooks/stripe/route.ts) listens for
 * checkout.session.completed and promotes the transaction to status='paid'.
 */

const tipSchema = z.object({
  kind: z.literal('tip'),
  site_id: z.string().uuid(),
  block_id: z.string().uuid().optional(),
  amount_cents: z.coerce.number().int().min(100).max(1_000_000),
  buyer_name: z.string().max(80).optional(),
  buyer_email: z.string().email().max(160).optional(),
  message: z.string().max(500).optional(),
  affiliate_code: z.string().max(20).optional(),
})

const merchSchema = z.object({
  kind: z.literal('merch'),
  site_id: z.string().uuid(),
  product_id: z.string().uuid(),
  block_id: z.string().uuid().optional(),
  affiliate_code: z.string().max(20).optional(),
})

const shoutoutSchema = z.object({
  kind: z.literal('shoutout'),
  site_id: z.string().uuid(),
  block_id: z.string().uuid().optional(),
  amount_cents: z.coerce.number().int().min(100).max(1_000_000),
  buyer_name: z.string().min(1).max(80),
  buyer_email: z.string().email().max(160),
  message: z.string().min(1).max(1000),
  recipient_name: z.string().max(80).optional(),
  affiliate_code: z.string().max(20).optional(),
})

const tierSchema = z.object({
  kind: z.literal('tier'),
  site_id: z.string().uuid(),
  tier_id: z.string().uuid(),
  buyer_email: z.string().email().max(160),
  buyer_name: z.string().max(80).optional(),
  affiliate_code: z.string().max(20).optional(),
})

const bodySchema = z.discriminatedUnion('kind', [
  tipSchema,
  merchSchema,
  shoutoutSchema,
  tierSchema,
])

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured on the server.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]!.message },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Look up the site for slug + currency + name, the owner's Connect ID,
  // and the success URL host.
  const { data: site } = await supabase
    .from('sites')
    .select('id, slug, display_name, custom_domain, status, user_id')
    .eq('id', parsed.data.site_id)
    .single()
  if (!site || site.status !== 'published') {
    return NextResponse.json(
      { error: 'Site not available for purchases' },
      { status: 404 }
    )
  }

  // Pull the owner's Connect account state. If onboarded, charges route
  // there with a platform application fee. If not, the charge stays on
  // the platform (the talent is owed money manually).
  let destinationAccount: string | null = null
  if (site.user_id) {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_charges_enabled')
      .eq('id', site.user_id)
      .maybeSingle()
    if (
      ownerProfile?.stripe_connect_account_id &&
      ownerProfile.stripe_connect_charges_enabled
    ) {
      destinationAccount = ownerProfile.stripe_connect_account_id
    }
  }

  const withConnect = (
    amountCents: number,
    extra: Record<string, unknown> = {}
  ): Record<string, unknown> => {
    if (!destinationAccount) return extra
    return {
      ...extra,
      application_fee_amount: platformFee(amountCents),
      transfer_data: { destination: destinationAccount },
    }
  }

  const origin = request.headers.get('origin') ?? new URL(request.url).origin
  const successUrl = `${origin}/site/${site.slug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${origin}/site/${site.slug}`

  try {
    const data = parsed.data
    const blockId = 'block_id' in data ? data.block_id : undefined
    const baseMetadata: Record<string, string> = {
      site_id: data.site_id,
      site_slug: site.slug,
      kind: `site_${data.kind}`,
      ...(blockId ? { block_id: blockId } : {}),
      ...(data.affiliate_code ? { affiliate_code: data.affiliate_code } : {}),
    }

    if (data.kind === 'tip') {
      const { data: txn } = await supabase
        .from('site_transactions')
        .insert({
          site_id: data.site_id,
          block_id: data.block_id ?? null,
          kind: 'tip',
          amount_cents: data.amount_cents,
          buyer_name: data.buyer_name ?? null,
          buyer_email: data.buyer_email ?? null,
          message: data.message ?? null,
          affiliate_code: data.affiliate_code ?? null,
          status: 'pending',
        })
        .select('id')
        .single()

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Tip — ${site.display_name ?? site.slug}`,
                description: data.message ? `"${data.message.slice(0, 200)}"` : undefined,
              },
              unit_amount: data.amount_cents,
            },
          },
        ],
        payment_intent_data: withConnect(data.amount_cents) as import('stripe').Stripe.Checkout.SessionCreateParams.PaymentIntentData,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: data.buyer_email,
        metadata: { ...baseMetadata, transaction_id: txn?.id ?? '' },
      })

      await supabase
        .from('site_transactions')
        .update({ stripe_session_id: session.id })
        .eq('id', txn?.id ?? '')

      return NextResponse.json({ url: session.url })
    }

    if (data.kind === 'merch') {
      const { data: product } = await supabase
        .from('site_products')
        .select('id, name, description, price_cents, currency, image_url, active')
        .eq('id', data.product_id)
        .eq('site_id', data.site_id)
        .single()
      if (!product || !product.active) {
        return NextResponse.json(
          { error: 'Product unavailable' },
          { status: 404 }
        )
      }

      const { data: txn } = await supabase
        .from('site_transactions')
        .insert({
          site_id: data.site_id,
          product_id: product.id,
          block_id: data.block_id ?? null,
          kind: 'merch',
          amount_cents: product.price_cents,
          currency: product.currency,
          affiliate_code: data.affiliate_code ?? null,
          status: 'pending',
        })
        .select('id')
        .single()

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
                images: product.image_url ? [product.image_url] : undefined,
              },
              unit_amount: product.price_cents,
            },
          },
        ],
        payment_intent_data: withConnect(product.price_cents) as import('stripe').Stripe.Checkout.SessionCreateParams.PaymentIntentData,
        shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU'] },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...baseMetadata,
          product_id: product.id,
          transaction_id: txn?.id ?? '',
        },
      })

      await supabase
        .from('site_transactions')
        .update({ stripe_session_id: session.id })
        .eq('id', txn?.id ?? '')

      return NextResponse.json({ url: session.url })
    }

    if (data.kind === 'shoutout') {
      const { data: txn } = await supabase
        .from('site_transactions')
        .insert({
          site_id: data.site_id,
          block_id: data.block_id ?? null,
          kind: 'shoutout',
          amount_cents: data.amount_cents,
          buyer_name: data.buyer_name,
          buyer_email: data.buyer_email,
          message: data.message,
          affiliate_code: data.affiliate_code ?? null,
          metadata: data.recipient_name
            ? { recipient_name: data.recipient_name }
            : {},
          status: 'pending',
        })
        .select('id')
        .single()

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Personalized shoutout — ${site.display_name ?? site.slug}`,
                description: data.recipient_name
                  ? `For ${data.recipient_name}`
                  : undefined,
              },
              unit_amount: data.amount_cents,
            },
          },
        ],
        payment_intent_data: withConnect(data.amount_cents) as import('stripe').Stripe.Checkout.SessionCreateParams.PaymentIntentData,
        customer_email: data.buyer_email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { ...baseMetadata, transaction_id: txn?.id ?? '' },
      })

      await supabase
        .from('site_transactions')
        .update({ stripe_session_id: session.id })
        .eq('id', txn?.id ?? '')

      return NextResponse.json({ url: session.url })
    }

    if (data.kind === 'tier') {
      const { data: tier } = await supabase
        .from('site_membership_tiers')
        .select('id, name, description, price_cents, billing_interval, stripe_price_id, active')
        .eq('id', data.tier_id)
        .eq('site_id', data.site_id)
        .single()
      if (!tier || !tier.active) {
        return NextResponse.json({ error: 'Tier unavailable' }, { status: 404 })
      }

      const { data: txn } = await supabase
        .from('site_transactions')
        .insert({
          site_id: data.site_id,
          tier_id: tier.id,
          kind: 'tier',
          amount_cents: tier.price_cents,
          buyer_email: data.buyer_email,
          buyer_name: data.buyer_name ?? null,
          affiliate_code: data.affiliate_code ?? null,
          status: 'pending',
        })
        .select('id')
        .single()

      // Prefer a saved Stripe Price (set up via API earlier); fall back to
      // creating a price on the fly each time. The fallback works but isn't
      // ideal — the owner should run a one-shot sync to pre-create prices.
      const lineItem = tier.stripe_price_id
        ? { quantity: 1, price: tier.stripe_price_id }
        : {
            quantity: 1,
            price_data: {
              currency: 'usd',
              product_data: { name: `${tier.name} — ${site.display_name ?? site.slug}` },
              unit_amount: tier.price_cents,
              recurring: {
                interval: tier.billing_interval === 'year' ? 'year' : 'month',
              },
            } as const,
          }

      const subBase: import('stripe').Stripe.Checkout.SessionCreateParams.SubscriptionData = {
        metadata: { ...baseMetadata, tier_id: tier.id, transaction_id: txn?.id ?? '' },
      }
      if (destinationAccount) {
        subBase.application_fee_percent = 15
        subBase.transfer_data = { destination: destinationAccount }
      }
      const sessionParams: import('stripe').Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        line_items: [lineItem as import('stripe').Stripe.Checkout.SessionCreateParams.LineItem],
        customer_email: data.buyer_email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { ...baseMetadata, tier_id: tier.id, transaction_id: txn?.id ?? '' },
        subscription_data: subBase,
      }
      const session = await stripe.checkout.sessions.create(sessionParams)

      await supabase
        .from('site_transactions')
        .update({ stripe_session_id: session.id })
        .eq('id', txn?.id ?? '')

      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown checkout error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
