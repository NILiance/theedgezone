/**
 * Stripe Connect Express helpers.
 *
 * Athletes onboard once via Stripe-hosted forms (KYC, bank link, tax info).
 * After onboarding we mirror the account state onto profiles so the UI can
 * render the right CTA without a live Stripe call per page.
 *
 * Platform fee is the same for every revenue block: PLATFORM_FEE_BPS = 1500
 * (15%). Override per-call by passing { platform_fee_bps } to the checkout
 * helpers when we add tiered pricing.
 */
import { stripe } from '@/lib/stripe'

export const PLATFORM_FEE_BPS = 1500 // 15.00%

export interface ConnectAccountState {
  account_id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  /** Normalized status: pending | restricted | active | disabled. */
  status: 'pending' | 'restricted' | 'active' | 'disabled'
  requirements_due_count: number
}

/**
 * Create a Stripe Connect Express account for the talent. Idempotent —
 * if the account already exists in our DB, reuse it.
 */
export async function createConnectAccount(opts: {
  email?: string
  country?: string
  business_type?: 'individual' | 'company'
  metadata?: Record<string, string>
}): Promise<{ accountId: string } | { error: string }> {
  if (!stripe) return { error: 'Stripe not configured' }
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: opts.country ?? 'US',
      email: opts.email,
      business_type: opts.business_type ?? 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: opts.metadata,
    })
    return { accountId: account.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Connect account error' }
  }
}

/** Create a one-shot onboarding URL. The talent completes Stripe-hosted KYC at this URL. */
export async function createOnboardingLink(opts: {
  accountId: string
  refresh_url: string
  return_url: string
}): Promise<{ url: string } | { error: string }> {
  if (!stripe) return { error: 'Stripe not configured' }
  try {
    const link = await stripe.accountLinks.create({
      account: opts.accountId,
      refresh_url: opts.refresh_url,
      return_url: opts.return_url,
      type: 'account_onboarding',
    })
    return { url: link.url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Onboarding link error' }
  }
}

/** Express-Dashboard login link for an already-onboarded account. */
export async function createLoginLink(accountId: string): Promise<{ url: string } | { error: string }> {
  if (!stripe) return { error: 'Stripe not configured' }
  try {
    const link = await stripe.accounts.createLoginLink(accountId)
    return { url: link.url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Login link error' }
  }
}

export async function fetchAccountState(accountId: string): Promise<ConnectAccountState | null> {
  if (!stripe) return null
  try {
    const acc = await stripe.accounts.retrieve(accountId)
    const due = (acc.requirements?.currently_due?.length ?? 0) + (acc.requirements?.past_due?.length ?? 0)
    let status: ConnectAccountState['status'] = 'pending'
    if (acc.charges_enabled && acc.payouts_enabled) status = 'active'
    else if (acc.requirements?.disabled_reason) status = 'disabled'
    else if (due > 0) status = 'restricted'
    return {
      account_id: acc.id,
      charges_enabled: Boolean(acc.charges_enabled),
      payouts_enabled: Boolean(acc.payouts_enabled),
      details_submitted: Boolean(acc.details_submitted),
      status,
      requirements_due_count: due,
    }
  } catch {
    return null
  }
}

/** Compute the platform fee on a gross amount in cents. */
export function platformFee(grossCents: number, feeBps = PLATFORM_FEE_BPS): number {
  return Math.round((grossCents * feeBps) / 10000)
}
