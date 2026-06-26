import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { CopySql } from './copy-sql'
import { MigrationRowActions } from './migration-row-actions'

export const metadata = { title: 'Migrations' }
// fs read + RPC are dynamic — never cache this page.
export const dynamic = 'force-dynamic'

// The SQL that powers this dashboard. Shown verbatim in the bootstrap
// banner so an admin can paste it into the Supabase SQL editor if the
// tracking function hasn't been applied yet (chicken-and-egg).
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

const MIGRATIONS_DIR = () => path.join(process.cwd(), 'supabase', 'migrations')

async function readLocalMigrations(): Promise<LocalMigration[]> {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR())
    return files
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map(parseLocalMigration)
  } catch {
    return []
  }
}

/**
 * Build a paste-ready SQL block for a pending migration: the file's SQL
 * plus a bookkeeping insert that records the version in
 * supabase_migrations.schema_migrations so THIS dashboard flips it to
 * "applied" afterward. The insert is wrapped in a DO block that swallows
 * errors so it can never roll back the migration itself (schema_migrations
 * column variance across Supabase versions).
 */
async function buildRunnableSql(m: LocalMigration): Promise<string> {
  let sql = ''
  try {
    sql = await fs.readFile(path.join(MIGRATIONS_DIR(), m.file), 'utf8')
  } catch {
    sql = `-- (could not read ${m.file})`
  }
  return `${sql.trimEnd()}

-- Record this migration so Admin -> System -> Migrations shows it as applied.
-- Tries version-only, falls back to including an empty statements array if
-- that column is NOT NULL on this instance.
do $$
begin
  begin
    insert into supabase_migrations.schema_migrations (version)
    values ('${m.version}') on conflict do nothing;
  exception when not_null_violation then
    insert into supabase_migrations.schema_migrations (version, statements)
    values ('${m.version}', array[]::text[]) on conflict do nothing;
  end;
exception when others then null;
end $$;
`
}

export default async function MigrationsAdminPage() {
  await requireAdmin()

  const local = await readLocalMigrations()

  // Direct link to this project's Supabase SQL editor (new query).
  let sqlEditorUrl: string | null = null
  try {
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname.split('.')[0]
    if (ref) sqlEditorUrl = `https://supabase.com/dashboard/project/${ref}/sql/new`
  } catch {
    /* leave null */
  }

  // Query applied versions via the RPC wrapper. trackingInstalled stays
  // false if the function itself hasn't been applied yet.
  let appliedVersions: string[] = []
  let trackingInstalled = false
  let rpcError: string | null = null
  const supabase = createServiceClient()
  if (!supabase) {
    rpcError = 'Service role key missing — set SUPABASE_SERVICE_ROLE_KEY.'
  } else {
    try {
      // Use .bind so the rpc method keeps its `this` (a detached
      // supabase.rpc reference throws inside supabase-js).
      const callRpc = supabase.rpc.bind(supabase) as unknown as (
        fn: string
      ) => Promise<{
        data: Array<{ version: string }> | null
        error: { message: string; code?: string } | null
      }>
      const { data, error } = await callRpc('list_applied_migrations')
      if (error) {
        rpcError = error.message
        // 42883 = undefined_function, PGRST202 = function not in schema cache
        trackingInstalled = !(
          error.code === '42883' ||
          error.code === 'PGRST202' ||
          /list_applied_migrations/.test(error.message)
        )
      } else {
        trackingInstalled = true
        appliedVersions = ((data ?? []) as Array<{ version: string }>).map((r) => r.version)
      }
    } catch (e) {
      rpcError = e instanceof Error ? e.message : 'RPC call failed'
      trackingInstalled = false
    }
  }

  const appliedSet = new Set(appliedVersions)
  const localVersionSet = new Set(local.map((m) => m.version))

  const rows = local.map((m) => ({ ...m, applied: appliedSet.has(m.version) }))
  const appliedCount = rows.filter((r) => r.applied).length
  const pendingMigrations = rows.filter((r) => !r.applied)
  const pendingCount = pendingMigrations.length

  // Read SQL for the pending set (small — only the unapplied ones). Skip
  // when tracking isn't installed, since then "everything" reads pending
  // and the bootstrap banner is the right first step instead.
  const pendingSql = trackingInstalled
    ? await Promise.all(
        pendingMigrations.map(async (m) => ({ ...m, sql: await buildRunnableSql(m) }))
      )
    : []

  const orphans = appliedVersions.filter((v) => !localVersionSet.has(v))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">System</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Migrations</h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Every <code>supabase/migrations</code> file and whether it&rsquo;s been applied to the
          database. To apply a pending one, copy its SQL below and run it in the{' '}
          <strong>Supabase SQL editor</strong>.
        </p>
        {sqlEditorUrl && (
          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-display mt-3 inline-block rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/20"
          >
            Open Supabase SQL editor →
          </a>
        )}
      </div>

      {!trackingInstalled && (
        <div className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4">
          <p className="text-display text-sm font-bold text-accent">
            ⚠ Migration tracking isn&rsquo;t installed yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The <code>list_applied_migrations()</code> function this page relies on hasn&rsquo;t
            been applied. Paste this into the Supabase SQL editor to enable the dashboard, then
            reload:
          </p>
          <div className="mt-3">
            <CopySql sql={BOOTSTRAP_SQL} label="Enable tracking" />
          </div>
          {rpcError && (
            <p className="mt-2 text-[10px] text-muted-foreground">DB said: {rpcError}</p>
          )}
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Files on disk" value={rows.length.toString()} tone="neutral" />
        <Tile label="Applied" value={trackingInstalled ? appliedCount.toString() : '—'} tone="ok" />
        <Tile
          label="Pending"
          value={trackingInstalled ? pendingCount.toString() : '—'}
          tone={pendingCount > 0 ? 'warn' : 'neutral'}
        />
      </div>

      {/* Pending migrations — paste-and-run SQL */}
      {trackingInstalled && pendingSql.length > 0 && (
        <div className="space-y-4 rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4">
          <div>
            <p className="text-display text-sm font-bold text-accent">
              {pendingSql.length} migration{pendingSql.length === 1 ? '' : 's'} to apply
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Copy each block, paste it into the Supabase SQL editor, and Run. The trailing
              bookkeeping line marks it applied so this dashboard updates when you reload.
            </p>
          </div>
          {pendingSql.map((m) => (
            <div key={m.file}>
              <p className="text-display mb-1 text-xs font-bold">
                {m.label}{' '}
                <span className="font-mono font-normal text-muted-foreground">({m.version})</span>
              </p>
              <CopySql sql={m.sql} label={m.file} />
            </div>
          ))}
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
              {trackingInstalled && <th className="px-3 py-2 text-left">Reconcile</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Couldn&rsquo;t read the migration files in this deploy.
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
                {trackingInstalled && (
                  <td className="px-3 py-2">
                    <MigrationRowActions version={r.version} applied={r.applied} />
                  </td>
                )}
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
