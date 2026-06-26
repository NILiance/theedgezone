'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function redeemReward(
  itemId: string
): Promise<{ ok: boolean; message?: string; balance?: number }> {
  await requireUser()
  const supabase = await createClient()
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>
  const { data, error } = await rpc('redeem_reward', { p_item: itemId })
  if (error) return { ok: false, message: error.message }
  const res = data as { ok?: boolean; error?: string; balance?: number } | null
  if (!res?.ok) {
    return { ok: false, message: res?.error ?? 'Redeem failed', balance: res?.balance }
  }
  revalidatePath('/dashboard/rewards')
  return { ok: true, balance: res.balance }
}
