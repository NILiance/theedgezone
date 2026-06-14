'use server'

import Stripe from 'stripe'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export type LogoModState = { ok?: boolean; error?: string; checkoutUrl?: string }

const TIER_PRICES = {
  quick: 4900,
  standard: 14900,
  pro: 34900,
} as const

export async function createLogoModRequest(
  _prev: LogoModState,
  form: FormData
): Promise<LogoModState> {
  const user = await requireUser()
  const supabase = await createClient()
  const tierRaw = String(form.get('tier') ?? 'standard') as keyof typeof TIER_PRICES
  const tier = (tierRaw in TIER_PRICES ? tierRaw : 'standard') as keyof typeof TIER_PRICES
  const originalLogoUrl = String(form.get('original_logo_url') ?? '').trim()
  const requestedChanges = String(form.get('requested_changes') ?? '').trim()
  if (!originalLogoUrl) return { error: 'Original logo URL is required' }
  if (requestedChanges.length < 20) return { error: 'Describe the changes you want (at least 20 chars)' }

  const amount = TIER_PRICES[tier]

  const { data: row, error } = await supabase
    .from('logo_mod_requests')
    .insert({
      user_id: user.id,
      original_logo_url: originalLogoUrl,
      requested_changes: requestedChanges,
      tier,
      amount_cents: amount,
      status: 'submitted',
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  if (!env.STRIPE_SECRET_KEY) return { error: 'Stripe is not configured on this deployment' }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY)
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: {
            name: `Logo Mod — ${tier} tier`,
            description: requestedChanges.slice(0, 250),
          },
        },
      },
    ],
    customer_email: user.email ?? undefined,
    success_url: `${siteUrl}/dashboard/logo-mod/success?request=${row.id}`,
    cancel_url: `${siteUrl}/dashboard/logo-mod`,
    metadata: {
      logo_mod_request_id: row.id,
      user_id: user.id,
    },
  })

  await supabase
    .from('logo_mod_requests')
    .update({ stripe_session_id: session.id })
    .eq('id', row.id)

  revalidatePath('/dashboard/logo-mod')
  return { ok: true, checkoutUrl: session.url ?? '' }
}
