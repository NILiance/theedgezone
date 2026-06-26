import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { RewardsClient, type RewardItem, type Redemption, type LedgerEntry } from './client'

export const metadata = { title: 'Rewards' }

export default async function RewardsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const [{ data: profile }, { data: items }, { data: redemptions }, { data: ledger }] =
    await Promise.all([
      supabase.from('profiles').select('points').eq('id', user.id).maybeSingle(),
      supabase
        .from('reward_items')
        .select('id, name, description, image_url, points_cost, stock, status')
        .eq('status', 'active')
        .order('points_cost', { ascending: true }),
      supabase
        .from('reward_redemptions')
        .select('id, reward_item_id, points_spent, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('point_transactions')
        .select('id, delta, reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
    ])

  const balance = (profile as { points?: number } | null)?.points ?? 0

  return (
    <RewardsClient
      balance={balance}
      items={(items ?? []) as RewardItem[]}
      redemptions={(redemptions ?? []) as Redemption[]}
      ledger={(ledger ?? []) as LedgerEntry[]}
    />
  )
}
