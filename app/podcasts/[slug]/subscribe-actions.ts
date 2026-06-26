'use server'

import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export async function subscribeToPodcast(input: {
  podcast_id: string
  email: string
}): Promise<{ ok: boolean; url?: string; message?: string }> {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, message: 'Payments are not configured.' }
  if (!/.+@.+\..+/.test(input.email)) return { ok: false, message: 'Enter a valid email.' }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Not available right now.' }

  const { data: pod } = await supabase
    .from('podcasts')
    .select('id, slug, title, subscription_enabled, subscription_price_cents')
    .eq('id', input.podcast_id)
    .maybeSingle()
  if (
    !pod ||
    !(pod as { subscription_enabled?: boolean }).subscription_enabled ||
    !(pod as { subscription_price_cents?: number }).subscription_price_cents
  ) {
    return { ok: false, message: 'Subscriptions are not enabled for this show.' }
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY)
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: input.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: (pod as { subscription_price_cents: number }).subscription_price_cents,
          recurring: { interval: 'month' },
          product_data: { name: `${pod.title} — Premium` },
        },
      },
    ],
    success_url: `${siteUrl}/podcasts/${pod.slug}?subscribed=1`,
    cancel_url: `${siteUrl}/podcasts/${pod.slug}`,
    metadata: { kind: 'podcast_sub', podcast_id: pod.id, subscriber_email: input.email },
  })
  return { ok: true, url: session.url ?? undefined }
}
