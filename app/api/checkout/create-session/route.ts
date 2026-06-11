import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { getCurrentUser } from '@/lib/auth'
import { getServicePricing } from '@/lib/services-pricing'
import { SERVICES } from '@/lib/services-data'

export const runtime = 'nodejs'

/**
 * Creates a Stripe Checkout session in EMBEDDED mode and returns its
 * client_secret. The browser then mounts <EmbeddedCheckout/> against that
 * secret to take payment inline — no redirect to checkout.stripe.com.
 */
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured — set STRIPE_SECRET_KEY in .env.local.' },
      { status: 503 }
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  }

  let body: { slug?: string; tier?: string }
  try {
    body = (await request.json()) as { slug?: string; tier?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.slug) {
    return NextResponse.json({ error: 'Missing service slug.' }, { status: 400 })
  }

  const service = SERVICES.find((s) => s.id === body.slug)
  if (!service) {
    return NextResponse.json({ error: 'Service not found.' }, { status: 404 })
  }

  const pricing = getServicePricing(body.slug, body.tier)
  if (!pricing) {
    return NextResponse.json(
      { error: 'This service does not have a fixed price — contact us to get started.' },
      { status: 400 }
    )
  }

  try {
    const session = await stripe.checkout.sessions.create({
      // @ts-expect-error — 'embedded' is supported by the API but not yet
      // in this SDK build's UiMode union. Safe to cast at the call site.
      ui_mode: 'embedded',
      mode: pricing.interval ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: pricing.currency,
            product_data: {
              name: pricing.display_label,
              description: service.tagline,
              metadata: { service_slug: body.slug },
            },
            unit_amount: pricing.unit_amount,
            ...(pricing.interval
              ? { recurring: { interval: pricing.interval } }
              : {}),
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      allow_promotion_codes: true,
      return_url: `${env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id: user.id,
        product_slug: body.slug,
        product_title: service.title,
        plan:
          pricing.interval === 'month'
            ? 'monthly'
            : pricing.interval === 'year'
              ? 'annual'
              : 'onetime',
        tier_label: pricing.tier_label,
      },
    })

    return NextResponse.json({ client_secret: session.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Stripe error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
