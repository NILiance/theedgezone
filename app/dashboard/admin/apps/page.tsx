import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Apps' }

export default async function AppsAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: apps } = await supabase
    .from('talent_apps')
    .select('id, slug, name, package_id, status, user_id, created_at, last_build_at')
    .order('created_at', { ascending: false })
    .limit(500)
  const userIds = Array.from(new Set((apps ?? []).map((a) => a.user_id).filter(Boolean) as string[]))
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
  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Mobile apps</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">All talent apps</h2>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">App</th>
              <th className="px-3 py-2 text-left">Bundle ID</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last build</th>
            </tr>
          </thead>
          <tbody>
            {(apps ?? []).map((a) => {
              const owner = profilesById.get(a.user_id) ?? null
              return (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-3 py-2 text-display font-bold">{a.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.package_id ?? '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    {owner?.display_name ?? '—'}
                    {owner?.email && <p className="text-muted-foreground">{owner.email}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        a.status === 'ready' || a.status === 'published'
                          ? 'bg-success/20 text-success'
                          : 'bg-panel-elevated text-muted-foreground'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {a.last_build_at ? new Date(a.last_build_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              )
            })}
            {(apps ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No apps yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
