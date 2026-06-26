import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { CopySql } from './copy-sql'
import { MigrationRowActions } from './migration-row-actions'

export const metadata = { title: 'Migrations' }
export const dynamic = 'force-dynamic'

// Bootstrap SQL for the detection function (shown if it isn't applied yet).
const BOOTSTRAP_SQL = `create or replace function public.db_objects()
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'tables', (select coalesce(jsonb_agg(lower(c.relname)),'[]'::jsonb)
      from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind in ('r','p')),
    'columns', (select coalesce(jsonb_agg(lower(col.table_name||'.'||col.column_name)),'[]'::jsonb)
      from information_schema.columns col where col.table_schema='public'),
    'functions', (select coalesce(jsonb_agg(distinct lower(p.proname)),'[]'::jsonb)
      from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public'),
    'policies', (select coalesce(jsonb_agg(lower(pol.tablename||'.'||pol.policyname)),'[]'::jsonb)
      from pg_catalog.pg_policies pol where pol.schemaname='public'),
    'indexes', (select coalesce(jsonb_agg(lower(idx.indexname)),'[]'::jsonb)
      from pg_catalog.pg_indexes idx where idx.schemaname='public')
  )
$$;
grant execute on function public.db_objects() to authenticated, service_role;`

type Status = 'applied' | 'pending' | 'unknown'

interface MigrationRow {
  file: string
  version: string
  label: string
  sql: string
  status: Status
  /** Expected objects that are missing — shown to explain a "pending". */
  missing: string[]
}

const MIGRATIONS_DIR = () => path.join(process.cwd(), 'supabase', 'migrations')

function prettyLabel(file: string): string {
  const rest = file
    .replace(/^\d+_?/, '')
    .replace(/\.sql$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
  return rest.length > 0 ? rest.charAt(0).toUpperCase() + rest.slice(1) : file
}

/** Parse the DDL targets a migration creates, so we can check they exist. */
function parseExpectedObjects(sql: string): {
  tables: string[]
  columns: string[]
  functions: string[]
  policies: string[]
  indexes: string[]
} {
  const s = sql.toLowerCase()
  const tables = new Set<string>()
  const columns = new Set<string>()
  const functions = new Set<string>()
  const policies = new Set<string>()
  const indexes = new Set<string>()

  for (const m of s.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?(\w+)"?/g))
    tables.add(m[1]!)
  for (const m of s.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?(\w+)"?/g))
    functions.add(m[1]!)
  for (const m of s.matchAll(
    /create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?"?(\w+)"?\s+on/g
  ))
    indexes.add(m[1]!)
  for (const m of s.matchAll(/create\s+policy\s+"([^"]+)"\s+on\s+(?:public\.)?"?(\w+)"?/g))
    policies.add(`${m[2]}.${m[1]}`)

  // Columns scoped to their enclosing ALTER TABLE block.
  const blocks = s.split(/alter\s+table\s+(?:if\s+exists\s+)?/).slice(1)
  for (const block of blocks) {
    const tm = block.match(/^(?:only\s+)?(?:public\.)?"?(\w+)"?/)
    if (!tm) continue
    const tbl = tm[1]!
    for (const cm of block.matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?"?(\w+)"?/g))
      columns.add(`${tbl}.${cm[1]!}`)
  }

  return {
    tables: [...tables],
    columns: [...columns],
    functions: [...functions],
    policies: [...policies],
    indexes: [...indexes],
  }
}

export default async function MigrationsAdminPage() {
  await requireAdmin()

  // Read every migration file + its SQL.
  let files: string[] = []
  try {
    files = (await fs.readdir(MIGRATIONS_DIR())).filter((f) => f.endsWith('.sql')).sort()
  } catch {
    files = []
  }
  const fileData = await Promise.all(
    files.map(async (file) => {
      let sql = ''
      try {
        sql = await fs.readFile(path.join(MIGRATIONS_DIR(), file), 'utf8')
      } catch {
        sql = ''
      }
      const version = (file.match(/^(\d+)/)?.[1] ?? file)
      return { file, version, label: prettyLabel(file), sql }
    })
  )

  let sqlEditorUrl: string | null = null
  try {
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname.split('.')[0]
    if (ref) sqlEditorUrl = `https://supabase.com/dashboard/project/${ref}/sql/new`
  } catch {
    /* leave null */
  }

  // Pull the live schema shape + the CLI-recorded versions (fallback).
  let detection: {
    tables: Set<string>
    columns: Set<string>
    functions: Set<string>
    policies: Set<string>
    indexes: Set<string>
  } | null = null
  let recorded = new Set<string>()
  let rpcError: string | null = null

  const supabase = createServiceClient()
  if (!supabase) {
    rpcError = 'Service role key missing — set SUPABASE_SERVICE_ROLE_KEY.'
  } else {
    // bind so rpc keeps its `this`.
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      fn: string
    ) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>
    try {
      const { data, error } = await rpc('db_objects')
      if (error) {
        rpcError = error.message
      } else if (data && typeof data === 'object') {
        const d = data as Record<string, string[]>
        const toSet = (arr?: string[]) => new Set((arr ?? []).map((x) => x.toLowerCase()))
        detection = {
          tables: toSet(d.tables),
          columns: toSet(d.columns),
          functions: toSet(d.functions),
          policies: toSet(d.policies),
          indexes: toSet(d.indexes),
        }
      }
    } catch (e) {
      rpcError = e instanceof Error ? e.message : 'db_objects call failed'
    }
    // Optional fallback: CLI-recorded versions for migrations with no
    // detectable objects (data/constraint-only).
    try {
      const { data } = await rpc('list_applied_migrations')
      if (Array.isArray(data)) {
        recorded = new Set((data as Array<{ version: string }>).map((r) => r.version))
      }
    } catch {
      /* fallback unavailable — undetectable migrations show "unknown" */
    }
  }

  const detectionInstalled = detection !== null

  const rows: MigrationRow[] = fileData.map((m) => {
    if (!detectionInstalled) {
      return { ...m, status: 'unknown', missing: [] }
    }
    const exp = parseExpectedObjects(m.sql)
    const det = detection!
    const missing: string[] = []
    for (const t of exp.tables) if (!det.tables.has(t)) missing.push(`table ${t}`)
    for (const c of exp.columns) if (!det.columns.has(c)) missing.push(`column ${c}`)
    for (const f of exp.functions) if (!det.functions.has(f)) missing.push(`function ${f}()`)
    for (const p of exp.policies) if (!det.policies.has(p)) missing.push(`policy ${p}`)
    for (const i of exp.indexes) if (!det.indexes.has(i)) missing.push(`index ${i}`)

    const detectableCount =
      exp.tables.length +
      exp.columns.length +
      exp.functions.length +
      exp.policies.length +
      exp.indexes.length

    let status: Status
    if (detectableCount === 0) {
      // Nothing to detect (e.g. constraint/data-only) — fall back to the
      // CLI-recorded version, else "unknown".
      status = recorded.has(m.version) ? 'applied' : 'unknown'
    } else {
      status = missing.length === 0 ? 'applied' : 'pending'
    }
    return { ...m, status, missing }
  })

  const appliedCount = rows.filter((r) => r.status === 'applied').length
  const pendingRows = rows.filter((r) => r.status === 'pending')
  const unknownCount = rows.filter((r) => r.status === 'unknown').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">System</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Migrations</h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Status is detected by checking whether each migration&rsquo;s tables, columns,
          functions, policies, and indexes actually exist in the database — so it&rsquo;s accurate
          no matter how you applied them. Copy a pending migration&rsquo;s SQL and run it in the{' '}
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

      {!detectionInstalled && (
        <div className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4">
          <p className="text-display text-sm font-bold text-accent">
            ⚠ Detection function isn&rsquo;t installed yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The dashboard needs <code>db_objects()</code> to inspect the schema. Paste this into
            the Supabase SQL editor, then reload:
          </p>
          <div className="mt-3">
            <CopySql sql={BOOTSTRAP_SQL} label="Enable detection" />
          </div>
          {rpcError && <p className="mt-2 text-[10px] text-muted-foreground">DB said: {rpcError}</p>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Files on disk" value={rows.length.toString()} tone="neutral" />
        <Tile label="Applied" value={detectionInstalled ? appliedCount.toString() : '—'} tone="ok" />
        <Tile
          label="Pending"
          value={detectionInstalled ? pendingRows.length.toString() : '—'}
          tone={pendingRows.length > 0 ? 'warn' : 'neutral'}
        />
        <Tile
          label="Unknown"
          value={detectionInstalled ? unknownCount.toString() : '—'}
          tone="neutral"
        />
      </div>

      {detectionInstalled && pendingRows.length > 0 && (
        <div className="space-y-4 rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4">
          <div>
            <p className="text-display text-sm font-bold text-accent">
              {pendingRows.length} migration{pendingRows.length === 1 ? '' : 's'} to apply
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Copy each block into the Supabase SQL editor and Run.
            </p>
          </div>
          {pendingRows.map((m) => (
            <div key={m.file}>
              <p className="text-display mb-1 text-xs font-bold">
                {m.label}{' '}
                <span className="font-mono font-normal text-muted-foreground">({m.version})</span>
              </p>
              {m.missing.length > 0 && (
                <p className="mb-1 text-[10px] text-muted-foreground">
                  Missing: {m.missing.join(', ')}
                </p>
              )}
              <CopySql sql={m.sql} label={m.file} />
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Version</th>
              <th className="px-3 py-2 text-left">Migration</th>
              <th className="px-3 py-2 text-left"></th>
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
                  {r.status === 'applied' ? (
                    <Pill tone="ok">✓ applied</Pill>
                  ) : r.status === 'pending' ? (
                    <Pill tone="warn">⚠ pending</Pill>
                  ) : (
                    <Pill tone="muted">? unknown</Pill>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.version}</td>
                <td className="px-3 py-2">
                  <p className="text-display font-bold">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    <code>{r.file}</code>
                  </p>
                  {r.status === 'pending' && r.missing.length > 0 && (
                    <p className="mt-0.5 text-[10px] text-accent">missing: {r.missing.join(', ')}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  {/* Manual override only for the rare undetectable migrations. */}
                  {detectionInstalled && r.status === 'unknown' && (
                    <MigrationRowActions version={r.version} applied={false} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detectionInstalled && unknownCount > 0 && (
        <p className="text-[11px] text-muted-foreground">
          &ldquo;Unknown&rdquo; means the migration only changes things we can&rsquo;t detect by
          shape (constraints, data, grants). Use <strong>Mark applied</strong> once you&rsquo;ve run
          it to clear it from the list.
        </p>
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
