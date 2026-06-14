import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { sendPushMessage, cancelPushMessage } from '../../push-actions'
import { SendButtons } from './send-buttons'

export const metadata = { title: 'Push message' }

export default async function PushMessagePage({
  params,
}: {
  params: Promise<{ id: string; messageId: string }>
}) {
  const { id: appId, messageId } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, name, user_id')
    .eq('id', appId)
    .single()
  if (!app || app.user_id !== user.id) notFound()

  const { data: message } = await supabase
    .from('app_push_messages')
    .select('*')
    .eq('id', messageId)
    .eq('app_id', appId)
    .maybeSingle()
  if (!message) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/apps/${appId}/push`}
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Push messages
        </Link>
        <p className="text-eyebrow mt-3 text-accent">{app.name}</p>
        <h1 className="text-display mt-1 text-2xl font-black tracking-tight">{message.title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{message.body}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Status" value={message.status} highlight={message.status === 'sent'} />
        <Stat label="Recipients" value={message.recipient_count.toString()} />
        <Stat label="Delivered" value={message.delivered_count.toString()} />
        <Stat label="Failed" value={message.failed_count.toString()} />
      </div>
      {message.scheduled_for && (
        <p className="text-xs text-muted-foreground">
          Scheduled for {new Date(message.scheduled_for).toLocaleString()}
        </p>
      )}
      {message.sent_at && (
        <p className="text-xs text-muted-foreground">
          Sent at {new Date(message.sent_at).toLocaleString()}
        </p>
      )}
      {message.error && (
        <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {message.error}
        </p>
      )}

      <SendButtons appId={appId} messageId={messageId} status={message.status} />

      {Boolean(message.data && Object.keys(message.data).length > 0) && (
        <section>
          <p className="text-eyebrow text-primary">Extra data</p>
          <pre className="mt-2 overflow-auto rounded-[var(--radius)] border border-border bg-panel/40 p-4 font-mono text-xs">
            {JSON.stringify(message.data, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p
        className={`text-display mt-1 text-2xl font-black uppercase tracking-tight ${
          highlight ? 'text-success' : 'text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
