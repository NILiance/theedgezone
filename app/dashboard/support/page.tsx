import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Support' }

export default async function SupportPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, subject, status, priority, last_activity_at, created_at')
    .eq('user_id', user.id)
    .order('last_activity_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-display text-3xl font-black tracking-tight">Support</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              File a ticket and the team will reply here. Average response under 24h.
            </p>
          </div>
          <Link href="/dashboard/support/new">
            <Button>+ New ticket</Button>
          </Link>
        </div>
      </div>

      {(tickets ?? []).length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          You haven&apos;t opened a ticket yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Last activity</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(tickets ?? []).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/support/${t.id}`}
                      className="text-display font-bold hover:text-primary"
                    >
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-xs uppercase tracking-widest">{t.priority}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(t.last_activity_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/support/${t.id}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
    >
      {status}
    </span>
  )
}
