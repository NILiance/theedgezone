import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Tickets' }

interface PageProps {
  searchParams: Promise<{ status?: string; priority?: string }>
}

export default async function TicketsAdminPage({ searchParams }: PageProps) {
  await requireAdmin()
  const sp = await searchParams
  const supabase = createServiceClient()

  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing — admin support needs it to read across all users.
      </p>
    )
  }

  let query = supabase
    .from('tickets')
    .select(
      'id, user_id, subject, category, priority, status, last_activity_at, created_at'
    )
    .order('last_activity_at', { ascending: false })
    .limit(500)
  if (sp.status) query = query.eq('status', sp.status)
  if (sp.priority) query = query.eq('priority', sp.priority)

  const { data: tickets } = await query
  const userIds = Array.from(
    new Set((tickets ?? []).map((t) => t.user_id).filter(Boolean) as string[])
  )
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
      const existing = profilesById.get(u.id) ?? { display_name: null, email: null }
      profilesById.set(u.id, { ...existing, email: u.email ?? null })
    }
  }

  const statusCounts = new Map<string, number>()
  for (const t of tickets ?? []) {
    statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Support</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Support tickets</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Total" value={(tickets ?? []).length.toLocaleString()} />
        <Tile label="Open" value={(statusCounts.get('open') ?? 0).toString()} />
        <Tile label="Pending" value={(statusCounts.get('pending') ?? 0).toString()} />
        <Tile label="Resolved" value={(statusCounts.get('resolved') ?? 0).toString()} />
      </div>

      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {[
          ['All', '/dashboard/admin/tickets'],
          ['Open', '/dashboard/admin/tickets?status=open'],
          ['Pending', '/dashboard/admin/tickets?status=pending'],
          ['Resolved', '/dashboard/admin/tickets?status=resolved'],
          ['Closed', '/dashboard/admin/tickets?status=closed'],
        ].map(([label, href]) => (
          <Link
            key={label}
            href={href!}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              (sp.status ?? '') === (label === 'All' ? '' : label!.toLowerCase())
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Subject</th>
              <th className="px-3 py-2 text-left">Requester</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Priority</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last activity</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No tickets match the current filter.
                </td>
              </tr>
            )}
            {(tickets ?? []).map((t) => {
              const profile = profilesById.get(t.user_id) ?? null
              return (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <Link
                      href={`/dashboard/admin/tickets/${t.id}`}
                      className="text-display font-bold hover:text-primary"
                    >
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <p>{profile?.display_name ?? '—'}</p>
                    {profile?.email && (
                      <p className="text-muted-foreground">{profile.email}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs uppercase tracking-widest text-muted-foreground">
                    {t.category}
                  </td>
                  <td className="px-3 py-3">
                    <PriorityPill priority={t.priority} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={t.status} />
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {new Date(t.last_activity_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/dashboard/admin/tickets/${t.id}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              )
            })}
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
    status === 'open'
      ? 'bg-accent/20 text-accent'
      : status === 'pending'
      ? 'bg-primary/20 text-primary'
      : status === 'resolved'
      ? 'bg-success/20 text-success'
      : 'bg-panel-elevated text-muted-foreground'
  return (
    <span
      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
    >
      {status}
    </span>
  )
}

function PriorityPill({ priority }: { priority: string }) {
  const tone =
    priority === 'urgent'
      ? 'bg-destructive/20 text-destructive'
      : priority === 'high'
      ? 'bg-accent/20 text-accent'
      : 'bg-panel-elevated text-muted-foreground'
  return (
    <span
      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
    >
      {priority}
    </span>
  )
}
