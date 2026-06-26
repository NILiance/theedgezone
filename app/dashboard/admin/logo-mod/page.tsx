import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatEasternDate } from '@/lib/format-date'
import { updateLogoModRequest } from './actions'

export const metadata = { title: 'Logo Mod Queue' }

export default async function AdminLogoModPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: requests } = await supabase
    .from('logo_mod_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const userIds = Array.from(new Set((requests ?? []).map((r) => r.user_id)))
  const profilesById = new Map<string, { display_name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const p of profiles ?? []) profilesById.set(p.id, { display_name: p.display_name, email: null })
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      const existing = profilesById.get(u.id) ?? { display_name: null, email: null }
      profilesById.set(u.id, { ...existing, email: u.email ?? null })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Logo Mod queue</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Designer queue</h2>
      </div>

      <div className="space-y-3">
        {(requests ?? []).map((r) => {
          const owner = profilesById.get(r.user_id)
          const delivered = (r.delivered_logo_urls as string[]) ?? []
          const tone =
            r.status === 'delivered'
              ? 'bg-success/20 text-success'
              : r.status === 'cancelled'
              ? 'bg-destructive/20 text-destructive'
              : 'bg-accent/20 text-accent'
          return (
            <details key={r.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
              <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer list-none">
                <div className="min-w-0 flex-1">
                  <p className="text-display font-bold">{owner?.display_name ?? owner?.email ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.tier} tier · ${(r.amount_cents / 100).toFixed(2)} ·{' '}
                    {formatEasternDate(r.created_at)}
                  </p>
                </div>
                <span
                  className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
                >
                  {r.status.replace('_', ' ')}
                </span>
              </summary>
              <div className="mt-4 space-y-3 text-sm">
                {r.original_logo_url && (
                  <div>
                    <p className="text-eyebrow text-muted-foreground">Original</p>
                    <a
                      href={r.original_logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline break-all"
                    >
                      {r.original_logo_url}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-eyebrow text-muted-foreground">Requested changes</p>
                  <p className="mt-1 whitespace-pre-line">{r.requested_changes}</p>
                </div>
                {delivered.length > 0 && (
                  <div>
                    <p className="text-eyebrow text-muted-foreground">Delivered</p>
                    <ul className="mt-1 space-y-1">
                      {delivered.map((url, i) => (
                        <li key={i}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-success hover:underline break-all"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <form
                  action={updateLogoModRequest}
                  className="grid gap-3 rounded-[var(--radius-sm)] border border-border bg-background/40 p-3 sm:grid-cols-[160px_1fr_auto]"
                >
                  <input type="hidden" name="request_id" value={r.id} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="in_progress">In progress</option>
                    <option value="review">Review</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input
                    name="delivered_logo_urls"
                    placeholder="Delivered URLs, one per line"
                    defaultValue={delivered.join('\n')}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 font-mono text-xs"
                  />
                  <button
                    type="submit"
                    className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
                  >
                    Update
                  </button>
                </form>
              </div>
            </details>
          )
        })}
        {(requests ?? []).length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No Logo Mod requests yet.
          </p>
        )}
      </div>
    </div>
  )
}
