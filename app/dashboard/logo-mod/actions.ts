'use server'

import Stripe from 'stripe'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { remixConcept } from '@/lib/ideogram'

export type LogoModState = { ok?: boolean; error?: string; checkoutUrl?: string }

/** Self-serve: remix the uploaded logo against the change prompt; re-host the
 *  variations (the generator's URLs are temporary). */
export async function generateLogoMods(input: {
  logo_url: string
  prompt: string
}): Promise<{ ok: boolean; variations?: string[]; message?: string }> {
  const user = await requireUser()
  if (!input.logo_url) return { ok: false, message: 'Upload your logo first.' }
  if ((input.prompt ?? '').trim().length < 5) {
    return { ok: false, message: 'Describe the changes you want.' }
  }
  let concepts
  try {
    concepts = await remixConcept({
      source_url: input.logo_url,
      prompt: input.prompt.trim(),
      count: 4,
      strength: 0.6,
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Generation failed' }
  }
  if (!concepts.length) {
    return { ok: false, message: 'The designer is not configured (missing key) or returned nothing.' }
  }

  const supabase = await createClient()
  const urls: string[] = []
  for (let i = 0; i < concepts.length; i++) {
    const src = concepts[i]!.url
    try {
      const res = await fetch(src)
      if (!res.ok) {
        urls.push(src)
        continue
      }
      const buf = Buffer.from(await res.arrayBuffer())
      const path = `${user.id}/logo-mods/${Date.now()}-${i}.png`
      const { error } = await supabase.storage
        .from('site-assets')
        .upload(path, buf, { contentType: 'image/png', upsert: true })
      urls.push(
        error ? src : supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl
      )
    } catch {
      urls.push(src)
    }
  }
  return { ok: true, variations: urls }
}

/** Save a chosen variation as an instantly-delivered self-serve logo mod. */
export async function saveLogoMod(input: {
  logo_url: string
  chosen_url: string
  prompt: string
}): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  if (!input.chosen_url) return { ok: false, message: 'Pick a variation first.' }
  const supabase = await createClient()
  const { error } = await supabase.from('logo_mod_requests').insert({
    user_id: user.id,
    original_logo_url: input.logo_url || null,
    requested_changes: input.prompt.slice(0, 500) || 'Self-serve logo mod',
    tier: 'quick',
    amount_cents: 0,
    status: 'delivered',
    delivered_logo_urls: [input.chosen_url],
    delivered_at: new Date().toISOString(),
    designer_notes: 'Created instantly with the in-house designer (self-serve).',
  })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/dashboard/logo-mod')
  return { ok: true }
}

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
