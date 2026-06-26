import { createServiceClient } from '@/lib/supabase/server'

/** Earning rates. Tune freely — all earning flows through here. */
export const POINTS = {
  signupBonus: 100,
  profileComplete: 250,
  dailyLogin: 10,
  /** Points per $1 spent on the platform. */
  purchasePerDollar: 5,
} as const

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>

async function rpcAward(
  supabase: ServiceClient,
  userId: string,
  amount: number,
  reason: string,
  dedupeKey: string | null,
  metadata: Record<string, unknown>
): Promise<number | null> {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>
  const { data, error } = await rpc('award_points', {
    p_user: userId,
    p_amount: amount,
    p_reason: reason,
    p_dedupe_key: dedupeKey,
    p_metadata: metadata,
  })
  if (error) return null
  return typeof data === 'number' ? data : null
}

/** Award points server-side. dedupeKey makes a one-time award idempotent. */
export async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  opts?: { dedupeKey?: string; metadata?: Record<string, unknown> }
): Promise<number | null> {
  const supabase = createServiceClient()
  if (!supabase) return null
  return rpcAward(supabase, userId, amount, reason, opts?.dedupeKey ?? null, opts?.metadata ?? {})
}

/** One-time signup bonus + daily-login streak. Safe to call on every load. */
export async function awardEngagement(userId: string): Promise<void> {
  const supabase = createServiceClient()
  if (!supabase) return
  await rpcAward(supabase, userId, POINTS.signupBonus, 'signup_bonus', `signup:${userId}`, {})
  const day = new Date().toISOString().slice(0, 10)
  await rpcAward(supabase, userId, POINTS.dailyLogin, 'daily_login', `login:${userId}:${day}`, { day })
}

/** One-time award when a talent completes their profile. */
export async function awardProfileComplete(userId: string): Promise<void> {
  await awardPoints(userId, POINTS.profileComplete, 'profile_complete', {
    dedupeKey: `profile_complete:${userId}`,
  })
}

/** Award points for a purchase (deduped by an order/session reference). */
export async function awardPurchase(
  userId: string,
  amountCents: number,
  ref: string
): Promise<void> {
  const pts = Math.floor((amountCents / 100) * POINTS.purchasePerDollar)
  if (pts <= 0) return
  await awardPoints(userId, pts, 'purchase', {
    dedupeKey: `purchase:${ref}`,
    metadata: { amount_cents: amountCents, ref },
  })
}
