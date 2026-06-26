import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatEastern } from '@/lib/format-date'
import { adminReplyToTicket, adminUpdateTicketStatus } from '../actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Ticket' }

export default async function AdminTicketDetailPage({ params }: PageProps) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, user_id, subject, body, category, priority, status, created_at')
    .eq('id', id)
    .single()
  if (!ticket) notFound()

  const { data: replies } = await supabase
    .from('ticket_replies')
    .select('id, author_id, body, is_internal, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', ticket.user_id)
    .maybeSingle()
  const { data: userRes } = await supabase.auth.admin.getUserById(ticket.user_id)
  const requester = profile?.display_name ?? userRes?.user?.email ?? 'Unknown'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/tickets"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Tickets
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-display text-2xl font-black tracking-tight">{ticket.subject}</h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          From {requester} · {ticket.category} · {ticket.priority} priority · opened{' '}
          {formatEastern(ticket.created_at)}
        </p>
      </div>

      <article className="space-y-3 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">{requester}</p>
        <p className="whitespace-pre-line text-sm text-foreground">{ticket.body}</p>
      </article>

      {(replies ?? []).map((r) => (
        <article
          key={r.id}
          className={`space-y-3 rounded-[var(--radius)] border p-5 ${
            r.is_internal
              ? 'border-accent/40 bg-accent/5'
              : r.author_id === ticket.user_id
              ? 'border-border bg-panel/40'
              : 'border-primary/30 bg-primary/5'
          }`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-eyebrow text-primary">
              {r.is_internal
                ? 'Internal note'
                : r.author_id === ticket.user_id
                ? requester
                : 'Edge Zone team'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatEastern(r.created_at)}
            </p>
          </div>
          <p className="whitespace-pre-line text-sm text-foreground">{r.body}</p>
        </article>
      ))}

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Reply</p>
        <form action={adminReplyToTicket} className="mt-3 space-y-3">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <textarea
            name="body"
            rows={6}
            required
            minLength={1}
            maxLength={8000}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
            placeholder="Write your reply…"
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_internal" className="h-4 w-4 accent-primary" />
            <span className="text-xs text-muted-foreground">
              Internal note (only visible to admins)
            </span>
          </label>
          <Button type="submit">Send reply</Button>
        </form>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Status</p>
        <form action={adminUpdateTicketStatus} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <div>
            <Label htmlFor="status">Set status</Label>
            <select
              id="status"
              name="status"
              defaultValue={ticket.status}
              className="flex h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Button type="submit">Update</Button>
        </form>
      </section>
    </div>
  )
}
