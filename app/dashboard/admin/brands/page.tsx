import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Brand Designs' }

export default async function BrandsAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: brands } = await supabase
    .from('brand_designs')
    .select('id, brand_name, sport, school, status, user_id, created_at, finalized_at, final_logo_url, brand_kit_url')
    .order('created_at', { ascending: false })
    .limit(500)
  const userIds = Array.from(new Set((brands ?? []).map((b) => b.user_id).filter(Boolean) as string[]))
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
  const statusCounts = new Map<string, number>()
  for (const b of brands ?? []) statusCounts.set(b.status, (statusCounts.get(b.status) ?? 0) + 1)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Brand designs</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">All brand designs</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Total" value={(brands ?? []).length.toString()} />
        <Tile label="Concept" value={(statusCounts.get('concept') ?? 0).toString()} />
        <Tile label="Refining" value={(statusCounts.get('refining') ?? 0).toString()} />
        <Tile label="Selected" value={(statusCounts.get('selected') ?? 0).toString()} />
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Brand</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Kit</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {(brands ?? []).map((b) => {
              const owner = profilesById.get(b.user_id) ?? null
              return (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="text-display font-bold">{b.brand_name ?? 'Unnamed'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {b.sport ?? '—'}
                      {b.school && ` · ${b.school}`}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {owner?.display_name ?? '—'}
                    {owner?.email && <p className="text-muted-foreground">{owner.email}</p>}
                  </td>
                  <td className="px-3 py-2 text-xs uppercase tracking-widest">{b.status}</td>
                  <td className="px-3 py-2 text-xs">
                    {b.brand_kit_url ? (
                      <a href={b.brand_kit_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Download
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
            {(brands ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No brand designs yet.
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
