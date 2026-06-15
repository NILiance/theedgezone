import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { DeliverRevisionForm } from './deliver-form'

export const metadata = { title: 'Brand revisions' }

export default async function BrandRevisionsAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }

  const { data: rows } = await supabase
    .from('brand_design_revisions')
    .select(
      'id, brand_design_id, user_id, notes, source, amount_cents, status, delivered_concept_url, delivered_at, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  const brandIds = Array.from(new Set((rows ?? []).map((r) => r.brand_design_id)))
  const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)))
  const brandMap = new Map<string, { brand_name: string | null; final_logo_url: string | null }>()
  const userMap = new Map<string, { display_name: string | null; email: string | null }>()
  if (brandIds.length) {
    const { data: brands } = await supabase
      .from('brand_designs')
      .select('id, brand_name, final_logo_url')
      .in('id', brandIds)
    for (const b of brands ?? []) brandMap.set(b.id, { brand_name: b.brand_name, final_logo_url: b.final_logo_url })
  }
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const p of profiles ?? []) userMap.set(p.id, { display_name: p.display_name, email: null })
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      const ex = userMap.get(u.id) ?? { display_name: null, email: null }
      userMap.set(u.id, { ...ex, email: u.email ?? null })
    }
  }

  const counts = {
    pending: (rows ?? []).filter((r) => r.status === 'pending').length,
    delivered: (rows ?? []).filter((r) => r.status === 'delivered').length,
    total: rows?.length ?? 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Brand revisions</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Revision queue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Talents file these from the Final Logo card. Each row shows the brand, the request
          notes, and the source (free, paid, admin). Upload the revised concept here to mark
          it delivered.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Pending" value={counts.pending.toString()} tone="accent" />
        <Tile label="Delivered" value={counts.delivered.toString()} tone="success" />
        <Tile label="Total" value={counts.total.toString()} tone="muted" />
      </div>

      <div className="space-y-3">
        {(rows ?? []).length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No revision requests yet.
          </p>
        )}
        {(rows ?? []).map((r) => {
          const brand = brandMap.get(r.brand_design_id)
          const owner = userMap.get(r.user_id)
          const isPending = r.status === 'pending'
          return (
            <div
              key={r.id}
              className={`rounded-[var(--radius)] border bg-panel/30 p-4 ${
                isPending ? 'border-accent/40' : 'border-border'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Link
                      href={`/dashboard/admin/brands/${r.brand_design_id}`}
                      className="text-display text-base font-bold hover:underline"
                    >
                      {brand?.brand_name ?? 'Untitled brand'}
                    </Link>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {owner?.display_name ?? owner?.email ?? r.user_id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                    {' · '}
                    <span className="capitalize">{r.source}</span>
                    {r.amount_cents > 0 && ` · $${(r.amount_cents / 100).toFixed(0)}`}
                  </p>
                  {r.notes && (
                    <blockquote className="mt-3 rounded-[var(--radius-sm)] border-l-2 border-primary/50 bg-background/40 p-3 text-sm">
                      {r.notes}
                    </blockquote>
                  )}
                </div>
                <span
                  className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    isPending
                      ? 'bg-accent/20 text-accent'
                      : r.status === 'delivered'
                        ? 'bg-success/20 text-success'
                        : 'bg-panel-elevated text-muted-foreground'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              {r.delivered_concept_url && (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.delivered_concept_url}
                    alt="Delivered revision"
                    className="h-16 w-16 rounded border border-border bg-white object-contain"
                  />
                  <a
                    href={r.delivered_concept_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Open delivered image →
                  </a>
                </div>
              )}

              {isPending && (
                <div className="mt-4 border-t border-border pt-4">
                  <DeliverRevisionForm
                    revisionId={r.id}
                    brandId={r.brand_design_id}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'accent' | 'success' | 'muted'
}) {
  const toneClass =
    tone === 'success' ? 'text-success' : tone === 'accent' ? 'text-accent' : 'text-muted-foreground'
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className={`text-display mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  )
}
