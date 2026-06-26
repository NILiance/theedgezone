import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatEastern } from '@/lib/format-date'
import { replyToTicket } from '../actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Ticket' }

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, user_id, subject, body, category, priority, status, created_at')
    .eq('id', id)
    .single()
  if (!ticket || ticket.user_id !== user.id) notFound()

  const { data: replies } = await supabase
    .from('ticket_replies')
    .select('id, author_id, body, is_internal, created_at')
    .eq('ticket_id', id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/support"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Support
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-display text-3xl font-black tracking-tight">{ticket.subject}</h1>
          <StatusPill status={ticket.status} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Opened {formatEastern(ticket.created_at)} ·{' '}
          {ticket.category} · {ticket.priority} priority
        </p>
      </div>

      <article className="space-y-3 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">You</p>
        <p className="whitespace-pre-line text-sm text-foreground">{ticket.body}</p>
      </article>

      {(replies ?? []).map((r) => (
        <article
          key={r.id}
          className={`space-y-3 rounded-[var(--radius)] border p-5 ${
            r.author_id === user.id
              ? 'border-border bg-panel/40'
              : 'border-primary/30 bg-primary/5'
          }`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-eyebrow text-primary">
              {r.author_id === user.id ? 'You' : 'Edge Zone team'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatEastern(r.created_at)}
            </p>
          </div>
          <p className="whitespace-pre-line text-sm text-foreground">{r.body}</p>
        </article>
      ))}

      {ticket.status !== 'closed' && (
        <form
          action={replyToTicket}
          className="space-y-3 rounded-[var(--radius)] border border-border bg-panel/40 p-5"
        >
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <Label htmlFor="reply_body">Reply</Label>
          <textarea
            id="reply_body"
            name="body"
            rows={6}
            required
            minLength={1}
            maxLength={8000}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit">Send reply</Button>
        </form>
      )}
      {ticket.status === 'closed' && (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-3 text-sm text-muted-foreground">
          This ticket is closed.{' '}
          <Link href="/dashboard/support/new" className="text-primary hover:underline">
            Open a new ticket
          </Link>{' '}
          if you need more help.
        </p>
      )}
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
      className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${tone}`}
    >
      {status}
    </span>
  )
}
