import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Migrations' }
// fs read + RPC are dynamic — never cache this page.
export const dynamic = 'force-dynamic'

// The SQL that powers this dashboard. Shown verbatim in the bootstrap
// banner so an admin can paste it into the Supabase SQL editor if the
// migration hasn't been pushed yet (chicken-and-egg).
const BOOTSTRAP_SQL = `create or replace function public.list_applied_migrations()
returns table (version text)
language sql
security definer
set search_path = ''
as $$
  select version::text
  from supabase_migrations.schema_migrations
  order by version
$$;
grant execute on function public.list_applied_migrations() to authenticated, service_role;`

interface LocalMigration {
  file: string
  version: string
  label: string
}

function parseLocalMigration(file: string): LocalMigration {
  const versionMatch = file.match(/^(\d+)/)
  const version = versionMatch ? versionMatch[1]! : file
  const rest = file
    .replace(/^\d+_?/, '')
    .replace(/\.sql$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
  const label = rest.length > 0 ? rest.charAt(0).toUpperCase() + rest.slice(1) : file
  return { file, version, label }
}

async function readLocalMigrations(): Promise<LocalMigration[]> {
  const dir = path.join(process.cwd(), 'supabase', 'migrations')
  try {
    const files = await fs.readdir(dir)
    return files
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map(parseLocalMigration)
  } catch {
    return []
  }
}

export default async function MigrationsAdminPage() {
  await requireAdmin()

  const local = await readLocalMigrations()

  // Query applied versions via the RPC wrapper. trackingInstalled stays
  // false if the function itself hasn't been applied yet.
  let appliedVersions: string[] = []
  let trackingInstalled = false
  let rpcError: string | null = null
  const supabase = createServiceClient()
  if (!supabase) {
    rpcError = 'Service role key missing — set SUPABASE_SERVICE_ROLE_KEY.'
  } else {
    // The fn isn't in the generated DB types yet (it's added by the
    // migration this page documents), so call through a narrowed cast.
    const callRpc = supabase.rpc as unknown as (
      fn: string
    ) => Promise<{
      data: Array<{ version: string }> | null
      error: { message: string; code?: string } | null
    }>
    const { data, error } = await callRpc('list_applied_migrations')
    if (error) {
      rpcError = error.message
      // 42883 = undefined_function, PGRST202 = function not found in schema cache
      trackingInstalled = !(
        error.code === '42883' ||
        error.code === 'PGRST202' ||
        /list_applied_migrations/.test(error.message)
      )
    } else {
      trackingInstalled = true
      appliedVersions = ((data ?? []) as Array<{ version: string }>).map((r) => r.version)
    }
  }

  const appliedSet = new Set(appliedVersions)
  const localVersionSet = new Set(local.map((m) => m.version))

  const rows = local.map((m) => ({
    ...m,
    applied: appliedSet.has(m.version),
  }))
  const appliedCount = rows.filter((r) => r.applied).length
  const pendingCount = rows.length - appliedCount

  // Applied versions with no local file (Supabase internal seeds, or
  // anything applied out-of-band). Informational only.
  const orphans = appliedVersions.filter((v) => !localVersionSet.has(v))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">System</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Migrations</h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Every <code>supabase/migrations</code> file and whether it&rsquo;s been applied to the
          connected database. Pending migrations need a <code>pnpm db:push</code>.
        </p>
      </div>

      {!trackingInstalled && (
        <div className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4">
          <p className="text-display text-sm font-bold text-accent">
            ⚠ Migration tracking isn&rsquo;t installed yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The <code>list_applied_migrations()</code> function this page relies on lives in a
            migration that hasn&rsquo;t been pushed. Run <code>pnpm db:push</code> to apply it (and
            everything else), or paste this into the Supabase SQL editor to enable the dashboard
            immediately:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
            {BOOTSTRAP_SQL}
          </pre>
          {rpcError && (
            <p className="mt-2 text-[10px] text-muted-foreground">DB said: {rpcError}</p>
          )}
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Total migrations" value={rows.length.toString()} tone="neutral" />
        <Tile label="Applied" value={trackingInstalled ? appliedCount.toString() : '—'} tone="ok" />
        <Tile
          label="Pending"
          value={trackingInstalled ? pendingCount.toString() : '—'}
          tone={pendingCount > 0 ? 'warn' : 'neutral'}
        />
      </div>

      {trackingInstalled && pendingCount > 0 && (
        <div className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
          <span className="text-display font-bold text-accent">{pendingCount} pending.</span>{' '}
          <span className="text-muted-foreground">
            Run <code>pnpm db:push</code> from the project root to apply them.
          </span>
        </div>
      )}

      {/* Migration table */}
      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Version</th>
              <th className="px-3 py-2 text-left">Migration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Couldn&rsquo;t read the migration files. (On Vercel this needs the scoped
                  outputFileTracingIncludes — verify the deploy included them.)
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.file} className="border-t border-border">
                <td className="px-3 py-2">
                  {!trackingInstalled ? (
                    <Pill tone="muted">unknown</Pill>
                  ) : r.applied ? (
                    <Pill tone="ok">✓ applied</Pill>
                  ) : (
                    <Pill tone="warn">⚠ pending</Pill>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.version}</td>
                <td className="px-3 py-2">
                  <p className="text-display font-bold">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    <code>{r.file}</code>
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orphans.length > 0 && (
        <div className="rounded-[var(--radius-sm)] border border-border bg-panel/30 p-4">
          <p className="text-eyebrow text-muted-foreground">
            Applied with no local file ({orphans.length})
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Versions recorded in the database that don&rsquo;t have a matching file in the repo —
            usually Supabase internal seeds or migrations applied out-of-band.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {orphans.map((v) => (
              <span
                key={v}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
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
  tone: 'neutral' | 'ok' | 'warn'
}) {
  const color =
    tone === 'ok' ? 'text-success' : tone === 'warn' ? 'text-accent' : 'text-foreground'
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className={`text-display text-3xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  )
}

function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'muted'; children: React.ReactNode }) {
  const cls =
    tone === 'ok'
      ? 'bg-success/20 text-success'
      : tone === 'warn'
        ? 'bg-accent/20 text-accent'
        : 'bg-panel-elevated text-muted-foreground'
  return (
    <span
      className={`text-display inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${cls}`}
    >
      {children}
    </span>
  )
}
