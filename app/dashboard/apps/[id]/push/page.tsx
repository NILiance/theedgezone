import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PushComposer } from './composer'

export const metadata = { title: 'Push notifications' }

export default async function PushPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, name, user_id, primary_color')
    .eq('id', id)
    .single()
  if (!app || app.user_id !== user.id) notFound()

  const [{ count: deviceCount }, { count: iosCount }, { count: androidCount }, { data: messages }] =
    await Promise.all([
      supabase
        .from('app_push_devices')
        .select('id', { count: 'exact', head: true })
        .eq('app_id', id)
        .is('revoked_at', null),
      supabase
        .from('app_push_devices')
        .select('id', { count: 'exact', head: true })
        .eq('app_id', id)
        .eq('platform', 'ios')
        .is('revoked_at', null),
      supabase
        .from('app_push_devices')
        .select('id', { count: 'exact', head: true })
        .eq('app_id', id)
        .eq('platform', 'android')
        .is('revoked_at', null),
      supabase
        .from('app_push_messages')
        .select('id, title, body, status, scheduled_for, sent_at, recipient_count, delivered_count, failed_count, error, created_at')
        .eq('app_id', id)
        .order('created_at', { ascending: false })
        .limit(30),
    ])

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard/apps/${id}`}
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← {app.name}
        </Link>
        <p className="text-eyebrow mt-3 text-accent">Push notifications</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">{app.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages route through the free Expo Push relay — no Firebase setup required.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Active devices" value={(deviceCount ?? 0).toString()} />
        <Tile label="iOS" value={(iosCount ?? 0).toString()} />
        <Tile label="Android" value={(androidCount ?? 0).toString()} />
      </div>

      <PushComposer appId={id} primary={app.primary_color ?? '#3aa7ff'} />

      <section>
        <p className="text-eyebrow mb-3 text-primary">History</p>
        <div className="space-y-2">
          {(messages ?? []).map((m) => (
            <MessageRow key={m.id} appId={id} message={m} />
          ))}
          {(messages ?? []).length === 0 && (
            <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
              No push messages yet.
            </p>
          )}
        </div>
      </section>
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

function MessageRow({
  appId,
  message,
}: {
  appId: string
  message: {
    id: string
    title: string
    body: string
    status: string
    scheduled_for: string | null
    sent_at: string | null
    recipient_count: number
    delivered_count: number
    failed_count: number
    error: string | null
    created_at: string
  }
}) {
  const tone =
    message.status === 'sent'
      ? 'bg-success/20 text-success'
      : message.status === 'failed'
      ? 'bg-destructive/20 text-destructive'
      : message.status === 'cancelled'
      ? 'bg-panel-elevated text-muted-foreground'
      : 'bg-accent/20 text-accent'
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-display truncate font-bold">{message.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{message.body}</p>
        </div>
        <span
          className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
        >
          {message.status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{new Date(message.created_at).toLocaleString()}</span>
        {message.scheduled_for && message.status === 'scheduled' && (
          <span>· Scheduled {new Date(message.scheduled_for).toLocaleString()}</span>
        )}
        {message.sent_at && <span>· Sent {new Date(message.sent_at).toLocaleString()}</span>}
        {message.recipient_count > 0 && (
          <span>
            · {message.delivered_count}/{message.recipient_count} delivered
            {message.failed_count > 0 && ` · ${message.failed_count} failed`}
          </span>
        )}
        {(message.status === 'draft' || message.status === 'scheduled') && (
          <form action={`/dashboard/apps/${appId}/push/run/${message.id}`} className="ml-auto">
            <a
              href={`/dashboard/apps/${appId}/push/${message.id}`}
              className="text-display text-primary hover:underline"
            >
              Open →
            </a>
          </form>
        )}
      </div>
      {message.error && <p className="mt-2 text-xs text-destructive">{message.error}</p>}
    </div>
  )
}
