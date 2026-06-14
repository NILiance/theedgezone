'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  createConnectAccount,
  createOnboardingLink,
  createLoginLink,
  fetchAccountState,
} from '@/lib/stripe-connect'
import { env } from '@/lib/env'

/**
 * Kicks off Connect onboarding. Reuses an existing account if the user
 * already has one but hasn't finished. Returns the Stripe-hosted URL the
 * client should redirect to.
 */
export async function startConnectOnboarding(): Promise<{ ok: boolean; url?: string; message?: string }> {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .maybeSingle()

  let accountId = profile?.stripe_connect_account_id ?? null
  if (!accountId) {
    const create = await createConnectAccount({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    })
    if ('error' in create) return { ok: false, message: create.error }
    accountId = create.accountId
    await supabase
      .from('profiles')
      .update({ stripe_connect_account_id: accountId, stripe_connect_status: 'pending' })
      .eq('id', user.id)
  }

  const base = env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.vercel.app'
  const link = await createOnboardingLink({
    accountId,
    refresh_url: `${base}/dashboard/payouts?refreshed=1`,
    return_url: `${base}/dashboard/payouts?completed=1`,
  })
  if ('error' in link) return { ok: false, message: link.error }
  return { ok: true, url: link.url }
}

/** Opens the Stripe Express dashboard for a connected account. */
export async function openExpressDashboard(): Promise<{ ok: boolean; url?: string; message?: string }> {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.stripe_connect_account_id) {
    return { ok: false, message: 'Connect onboarding not started yet.' }
  }
  const link = await createLoginLink(profile.stripe_connect_account_id)
  if ('error' in link) return { ok: false, message: link.error }
  return { ok: true, url: link.url }
}

/** Re-poll Stripe and mirror the latest account state onto profiles. */
export async function syncConnectStatus(): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.stripe_connect_account_id) {
    return { ok: false, message: 'No Connect account on file yet.' }
  }
  const state = await fetchAccountState(profile.stripe_connect_account_id)
  if (!state) return { ok: false, message: 'Stripe lookup failed.' }
  await supabase
    .from('profiles')
    .update({
      stripe_connect_status: state.status,
      stripe_connect_charges_enabled: state.charges_enabled,
      stripe_connect_payouts_enabled: state.payouts_enabled,
      stripe_connect_details_submitted: state.details_submitted,
      stripe_connect_onboarded_at:
        state.status === 'active' ? new Date().toISOString() : null,
    })
    .eq('id', user.id)
  revalidatePath('/dashboard/payouts')
  return { ok: true }
}
