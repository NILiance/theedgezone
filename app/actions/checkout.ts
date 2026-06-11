'use server'

import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { requireUser } from '@/lib/auth'
import { getServicePricing } from '@/lib/services-pricing'
import { SERVICES } from '@/lib/services-data'

export async function createCheckoutSession(formData: FormData) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local.')
  }

  const slug = formData.get('slug')?.toString()
  const tierLabel = formData.get('tier')?.toString() || undefined
  if (!slug) throw new Error('Missing service slug.')

  const service = SERVICES.find((s) => s.id === slug)
  if (!service) throw new Error('Service not found.')

  const pricing = getServicePricing(slug, tierLabel)
  if (!pricing) {
    throw new Error('This service does not have a fixed price — contact us to get started.')
  }

  const user = await requireUser()

  const session = await stripe.checkout.sessions.create({
    mode: pricing.interval ? 'subscription' : 'payment',
    line_items: [
      {
        price_data: {
          currency: pricing.currency,
          product_data: {
            name: pricing.display_label,
            description: service.tagline,
            metadata: { service_slug: slug },
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
    success_url: `${env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/services/${slug}?checkout=cancelled`,
    metadata: {
      user_id: user.id,
      product_slug: slug,
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

  if (!session.url) throw new Error('Stripe did not return a checkout URL.')

  redirect(session.url)
}
