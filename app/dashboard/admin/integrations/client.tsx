'use client'

import { useState } from 'react'

interface KeyStatus {
  label: string
  env: string
  secret?: boolean
  required?: boolean
  present: boolean
}

interface Group {
  name: string
  module: string
  summary: string
  consoleUrl?: string
  docsUrl?: string
  steps: string[]
  keys: KeyStatus[]
}

export function IntegrationsAdmin({ groups }: { groups: Group[] }) {
  const totalRequired = groups.flatMap((g) => g.keys).filter((k) => k.required).length
  const presentRequired = groups
    .flatMap((g) => g.keys)
    .filter((k) => k.required && k.present).length
  const allReady = groups.map((g) => readiness(g))
  const completelyConfigured = allReady.filter((s) => s === 'complete').length
  const partial = allReady.filter((s) => s === 'partial').length
  const missing = allReady.filter((s) => s === 'missing').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Integrations</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
          External system status
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Every integration with a step-by-step setup guide. Edit credentials in Vercel project
          settings (or <code className="font-mono">.env.local</code> for dev) — never store secrets
          in this UI. Click any integration to expand the guide.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Configured" value={completelyConfigured.toString()} tone="success" />
        <Tile label="Partial" value={partial.toString()} tone="accent" />
        <Tile label="Missing" value={missing.toString()} tone="muted" />
        <Tile
          label="Required keys"
          value={`${presentRequired} / ${totalRequired}`}
          tone={presentRequired === totalRequired ? 'success' : 'destructive'}
        />
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <IntegrationCard key={g.name} group={g} />
        ))}
      </div>
    </div>
  )
}

function readiness(g: Group): 'complete' | 'partial' | 'missing' {
  const required = g.keys.filter((k) => k.required)
  if (required.length > 0) {
    if (required.every((k) => k.present)) return 'complete'
    if (required.some((k) => k.present)) return 'partial'
  }
  const present = g.keys.filter((k) => k.present).length
  if (present === g.keys.length && g.keys.length > 0) return 'complete'
  if (present > 0) return 'partial'
  return 'missing'
}

function IntegrationCard({ group }: { group: Group }) {
  const [open, setOpen] = useState(false)
  const state = readiness(group)
  const tone =
    state === 'complete'
      ? 'border-success/40 bg-success/5'
      : state === 'partial'
      ? 'border-accent/40 bg-accent/5'
      : 'border-border bg-panel/40'
  const pillTone =
    state === 'complete'
      ? 'bg-success/20 text-success'
      : state === 'partial'
      ? 'bg-accent/20 text-accent'
      : 'bg-panel-elevated text-muted-foreground'

  return (
    <div className={`rounded-[var(--radius)] border ${tone}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-display text-base font-black">{group.name}</p>
            <span
              className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${pillTone}`}
            >
              {state}
            </span>
          </div>
          <p className="text-eyebrow mt-1 text-[10px] text-muted-foreground">{group.module}</p>
          <p className="mt-2 text-xs text-muted-foreground">{group.summary}</p>
        </div>
        <span className="text-display text-xs font-bold uppercase tracking-widest text-primary">
          {open ? '− Hide setup' : '+ Setup'}
        </span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-border px-5 pb-5 pt-4">
          {(group.consoleUrl || group.docsUrl) && (
            <div className="flex flex-wrap gap-2">
              {group.consoleUrl && (
                <a
                  href={group.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary"
                >
                  Open console →
                </a>
              )}
              {group.docsUrl && (
                <a
                  href={group.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                >
                  Docs ↗
                </a>
              )}
            </div>
          )}

          <div>
            <p className="text-eyebrow mb-2 text-primary">Setup steps</p>
            <ol className="space-y-2 text-sm text-foreground">
              {group.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-display flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="text-eyebrow mb-2 text-primary">Required env vars</p>
            <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-background/40">
              <table className="w-full text-xs">
                <thead className="bg-panel-elevated/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Label</th>
                    <th className="px-3 py-2 text-left">Env var</th>
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.keys.map((k) => (
                    <tr key={k.env} className="border-t border-border">
                      <td className="px-3 py-2">
                        {k.label}
                        {k.required && (
                          <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
                            required
                          </span>
                        )}
                        {k.secret && (
                          <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            secret
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px]">{k.env}</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                            k.present
                              ? 'bg-success/20 text-success'
                              : k.required
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-panel-elevated text-muted-foreground'
                          }`}
                        >
                          {k.present ? 'set' : 'missing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Add these in <span className="font-bold text-foreground">Vercel → Settings → Environment Variables</span> for Production / Preview / Development. Save, then push to <code className="font-mono">main</code> (or hit Redeploy) to apply.
            </p>
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
  tone: 'success' | 'accent' | 'muted' | 'destructive'
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'accent'
      ? 'text-accent'
      : tone === 'destructive'
      ? 'text-destructive'
      : 'text-muted-foreground'
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className={`text-display mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  )
}
