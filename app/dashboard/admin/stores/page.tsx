import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Stores' }

export default async function StoresAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: stores } = await supabase
    .from('stores')
    .select('id, slug, name, status, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  const userIds = Array.from(new Set((stores ?? []).map((s) => s.user_id).filter(Boolean) as string[]))
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

  const storeIds = (stores ?? []).map((s) => s.id)
  const { data: orders } = storeIds.length
    ? await supabase
        .from('store_orders')
        .select('store_id, amount_cents, status')
        .in('store_id', storeIds)
    : { data: [] as Array<{ store_id: string; amount_cents: number; status: string }> }
  const statsByStore = new Map<string, { orders: number; revenue: number }>()
  for (const o of orders ?? []) {
    const s = statsByStore.get(o.store_id) ?? { orders: 0, revenue: 0 }
    s.orders += 1
    if (o.status === 'paid' || o.status === 'fulfilled' || o.status === 'shipped') s.revenue += o.amount_cents ?? 0
    statsByStore.set(o.store_id, s)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">NIL stores</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">All stores</h2>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Store</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Orders</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(stores ?? []).map((s) => {
              const owner = profilesById.get(s.user_id) ?? null
              const stats = statsByStore.get(s.id) ?? { orders: 0, revenue: 0 }
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="text-display font-bold">{s.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">/store/{s.slug}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {owner?.display_name ?? '—'}
                    {owner?.email && <p className="text-muted-foreground">{owner.email}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        s.status === 'open' ? 'bg-success/20 text-success' : 'bg-panel-elevated text-muted-foreground'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs">{stats.orders}</td>
                  <td className="px-3 py-2 text-right font-bold text-primary">
                    ${(stats.revenue / 100).toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <a href={`/store/${s.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline">
                      View →
                    </a>
                  </td>
                </tr>
              )
            })}
            {(stores ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No stores yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
