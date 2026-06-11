import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { sharetribeEnabled, integrationConfigured, marketplaceConfigured } from '@/lib/sharetribe'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'NILiance Bridge' }

export default async function NilianceAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()

  const [{ data: profiles }, { data: events }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, display_name, niliance_link_status, niliance_user_id, niliance_link_error, niliance_synced_at, niliance_last_attempt_at'
      )
      .order('niliance_last_attempt_at', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from('niliance_sync_events')
      .select('id, user_id, level, direction, message, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const linkedCount = profiles?.filter((p) => p.niliance_link_status === 'linked').length ?? 0
  const errorCount = profiles?.filter((p) => p.niliance_link_status === 'error').length ?? 0
  const pendingCount = profiles?.filter((p) => p.niliance_link_status === 'pending').length ?? 0
  const unlinkedCount = profiles?.filter((p) => p.niliance_link_status === 'unlinked').length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-display text-2xl font-black tracking-tight">NILiance Bridge</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sharetribe integration that auto-creates NILiance accounts on Edge Zone signup and
          syncs profile data on save.
        </p>
      </div>

      {/* Config status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <ConfigPill label="Integration API" ok={integrationConfigured} />
            <ConfigPill label="Marketplace API" ok={marketplaceConfigured} />
            <ConfigPill label="Bridge Live" ok={sharetribeEnabled} />
          </div>
          {!sharetribeEnabled && (
            <p className="mt-4 text-xs text-muted-foreground">
              Set <code>SHARETRIBE_CLIENT_ID</code>, <code>SHARETRIBE_CLIENT_SECRET</code>,{' '}
              <code>SHARETRIBE_MP_CLIENT_ID</code>, and{' '}
              <code>SHARETRIBE_MP_CLIENT_SECRET</code> in <code>.env.local</code> and
              restart dev to enable the bridge.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile value={linkedCount} label="Linked" />
        <StatTile value={pendingCount} label="Pending" />
        <StatTile value={errorCount} label="Errors" tone="error" />
        <StatTile value={unlinkedCount} label="Unlinked" tone="muted" />
      </div>

      {/* User sync status */}
      <section>
        <p className="text-eyebrow mb-3 text-muted-foreground">User sync status</p>
        <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-panel-elevated">
              <tr>
                <Th>User</Th>
                <Th>Status</Th>
                <Th>NILiance UUID</Th>
                <Th>Last sync / attempt</Th>
                <Th>Error</Th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).slice(0, 25).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0">
                  <Td>
                    <Link href={`/dashboard/admin/users#${p.id}`} className="text-foreground hover:text-primary">
                      {p.display_name ?? p.id.slice(0, 8)}
                    </Link>
                  </Td>
                  <Td><StatusPill status={p.niliance_link_status} /></Td>
                  <Td className="font-mono text-xs">
                    {p.niliance_user_id ? `${p.niliance_user_id.slice(0, 8)}…` : '—'}
                  </Td>
                  <Td className="text-xs text-muted-foreground">
                    {p.niliance_synced_at
                      ? new Date(p.niliance_synced_at).toLocaleString()
                      : p.niliance_last_attempt_at
                        ? new Date(p.niliance_last_attempt_at).toLocaleString()
                        : '—'}
                  </Td>
                  <Td className="max-w-xs truncate text-xs text-destructive">
                    {p.niliance_link_error ?? ''}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!profiles || profiles.length === 0) && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No profiles yet. Once users sign up, attempts will appear here.
            </p>
          )}
        </div>
      </section>

      {/* Recent events */}
      <section>
        <p className="text-eyebrow mb-3 text-muted-foreground">Recent events</p>
        <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-panel-elevated">
              <tr>
                <Th>Time</Th>
                <Th>Level</Th>
                <Th>Dir</Th>
                <Th>Message</Th>
              </tr>
            </thead>
            <tbody>
              {(events ?? []).map((e) => (
                <tr key={e.id} className="border-b border-border last:border-b-0">
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </Td>
                  <Td>
                    <LevelPill level={e.level} />
                  </Td>
                  <Td className="text-xs text-muted-foreground">{e.direction}</Td>
                  <Td className="text-xs">{e.message}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!events || events.length === 0) && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No events yet.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function ConfigPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`rounded-[var(--radius-sm)] border p-3 ${ok ? 'border-success/40 bg-success/5' : 'border-border bg-panel/60'}`}
    >
      <div className="flex items-center gap-2">
        <span className={ok ? 'text-success' : 'text-muted-foreground'}>{ok ? '✓' : '○'}</span>
        <span className="text-sm font-bold text-foreground">{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {ok ? 'Configured' : 'Not configured'}
      </p>
    </div>
  )
}

function StatTile({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone?: 'error' | 'muted'
}) {
  const colorClass = tone === 'error' ? 'text-destructive' : tone === 'muted' ? 'text-muted-foreground' : 'text-primary'
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/60 p-5 text-center">
      <p className={`text-display text-3xl font-black ${colorClass}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </th>
  )
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}

function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    linked: 'bg-success/20 text-success',
    pending: 'bg-primary/20 text-primary',
    error: 'bg-red-900/30 text-red-300',
    unlinked: 'bg-panel-elevated text-muted-foreground',
  }
  return (
    <span
      className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
        colorMap[status] ?? 'bg-panel-elevated text-muted-foreground'
      }`}
    >
      {status}
    </span>
  )
}

function LevelPill({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    info: 'bg-primary/15 text-primary',
    warn: 'bg-accent/20 text-accent',
    error: 'bg-red-900/30 text-red-300',
  }
  return (
    <span
      className={`text-display rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
        colorMap[level] ?? 'bg-panel-elevated text-muted-foreground'
      }`}
    >
      {level}
    </span>
  )
}
