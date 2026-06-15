import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Websites' }

export default async function WebsitesAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: sites } = await supabase
    .from('sites')
    .select('id, slug, display_name, status, user_id, created_at, published_at, custom_domain')
    .order('created_at', { ascending: false })
    .limit(500)
  const userIds = Array.from(new Set((sites ?? []).map((s) => s.user_id).filter(Boolean) as string[]))
  const profilesById = new Map<string, { display_name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      profilesById.set(p.id, { display_name: p.display_name, email: null })
    }
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      const ex = profilesById.get(u.id) ?? { display_name: null, email: null }
      profilesById.set(u.id, { ...ex, email: u.email ?? null })
    }
  }
  const statusCounts = new Map<string, number>()
  for (const s of sites ?? []) statusCounts.set(s.status, (statusCounts.get(s.status) ?? 0) + 1)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Websites</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">All personal websites</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Total" value={(sites ?? []).length.toLocaleString()} />
        <Tile label="Published" value={(statusCounts.get('published') ?? 0).toString()} />
        <Tile label="Draft" value={(statusCounts.get('draft') ?? 0).toString()} />
        <Tile label="Custom domains" value={(sites ?? []).filter((s) => s.custom_domain).length.toString()} />
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Site</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Custom domain</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(sites ?? []).map((s) => {
              const owner = profilesById.get(s.user_id) ?? null
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="text-display font-bold">{s.display_name ?? s.slug}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {s.slug}.mytalentsite.com
                    </p>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {owner?.display_name ?? '—'}
                    {owner?.email && <p className="text-muted-foreground">{owner.email}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{s.custom_domain ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {s.status === 'published' ? (
                      <a
                        href={`/site/${s.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View live →
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground capitalize">{s.status}</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {(sites ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No sites yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className="text-display mt-1 text-2xl font-black text-primary">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'published'
      ? 'bg-success/20 text-success'
      : 'bg-panel-elevated text-muted-foreground'
  return (
    <span className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}>
      {status}
    </span>
  )
}
