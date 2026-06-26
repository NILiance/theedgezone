import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatEasternDate } from '@/lib/format-date'
import { RewardsManager } from './manager'

export const metadata = { title: 'Rewards' }

export default async function RewardsAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const [{ data: items }, { data: redemptions }] = await Promise.all([
    supabase
      .from('reward_items')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('reward_redemptions')
      .select('id, user_id, reward_item_id, points_spent, status, created_at, fulfilled_at, notes')
      .order('created_at', { ascending: false })
      .limit(100),
  ])
  const userIds = Array.from(new Set((redemptions ?? []).map((r) => r.user_id)))
  const profilesById = new Map<string, { display_name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds)
    for (const p of profiles ?? []) profilesById.set(p.id, { display_name: p.display_name, email: null })
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      const ex = profilesById.get(u.id) ?? { display_name: null, email: null }
      profilesById.set(u.id, { ...ex, email: u.email ?? null })
    }
  }
  const itemsById = new Map((items ?? []).map((i) => [i.id, i]))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-primary">Rewards</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Rewards store</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Items members can redeem with earned points. Talents see active items in the Points tab.
        </p>
      </div>

      <RewardsManager items={items ?? []} />

      <section>
        <p className="text-eyebrow mb-3 text-primary">Recent redemptions</p>
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Member</th>
                <th className="px-3 py-2 text-left">Reward</th>
                <th className="px-3 py-2 text-right">Points</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(redemptions ?? []).map((r) => {
                const profile = profilesById.get(r.user_id)
                const item = itemsById.get(r.reward_item_id)
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 text-xs">{formatEasternDate(r.created_at)}</td>
                    <td className="px-3 py-2 text-xs">
                      {profile?.display_name ?? profile?.email ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">{item?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-xs">{r.points_spent}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          r.status === 'fulfilled'
                            ? 'bg-success/20 text-success'
                            : r.status === 'cancelled'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-panel-elevated text-muted-foreground'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {(redemptions ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No redemptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
