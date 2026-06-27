'use client'

import { useState } from 'react'
import { APP_EXTENSIONS, extensionCategories, type AppExtension } from '@/lib/app-extensions'
import { APP_INTEGRATIONS, type AppIntegrations } from '@/lib/app-integrations'

/**
 * Extension Store — the legacy's 68-extension catalog with search + category
 * filter. Installing an extension that carries a `screen` auto-adds that screen
 * (handled by the parent via onToggle).
 */
export function ExtensionsTab({
  installed,
  onToggle,
  integrations,
  onIntegration,
}: {
  installed: string[]
  onToggle: (ext: AppExtension, install: boolean) => void
  integrations: AppIntegrations
  onIntegration: (id: string, url: string) => void
}) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const cats = extensionCategories()
  const q = search.trim().toLowerCase()
  const connectable = APP_INTEGRATIONS.filter((i) => installed.includes(i.id))

  const shown = APP_EXTENSIONS.filter((x) => {
    if (filter === 'installed') {
      if (!installed.includes(x.id)) return false
    } else if (filter !== 'all') {
      if (x.cat !== filter) return false
    }
    if (q && !x.name.toLowerCase().includes(q) && !x.desc.toLowerCase().includes(q) && !x.cat.toLowerCase().includes(q)) return false
    return true
  })

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-panel/40 text-muted-foreground hover:border-primary/40'
    }`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-display text-2xl font-black">Extension Store</h2>
          <p className="text-xs text-muted-foreground">More than {APP_EXTENSIONS.length} extensions for your app</p>
        </div>
        <p className="text-display text-sm font-bold text-success">{installed.length} installed</p>
      </div>

      {connectable.length > 0 && (
        <div className="rounded-[var(--radius)] border border-primary/30 bg-panel/40 p-4">
          <p className="text-eyebrow text-primary">Connected sources</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Paste a source URL — its content syncs into your app live.</p>
          <div className="mt-3 space-y-2.5">
            {connectable.map((i) => (
              <label key={i.id} className="block text-sm">
                <span className="block text-xs text-muted-foreground">{i.icon} {i.label} — {i.help}</span>
                <input
                  value={integrations[i.id]?.url ?? ''}
                  onChange={(e) => onIntegration(i.id, e.target.value)}
                  placeholder={i.placeholder}
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search extensions…"
        className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter('all')} className={chip(filter === 'all')}>All ({APP_EXTENSIONS.length})</button>
        <button type="button" onClick={() => setFilter('installed')} className={chip(filter === 'installed')}>Installed ({installed.length})</button>
        {cats.map((c) => (
          <button key={c.name} type="button" onClick={() => setFilter(c.name)} className={chip(filter === c.name)}>
            {c.name} ({c.count})
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((x) => {
          const on = installed.includes(x.id)
          return (
            <div key={x.id} className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-xl" style={{ background: x.bg }}>
                {x.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-display text-sm font-bold">{x.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{x.desc}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">{x.price}</span>
                  {x.screen && (
                    <span className="text-display rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">Screen</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggle(x, !on)}
                className={`text-display shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold transition-colors ${
                  on ? 'bg-success/20 text-success' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {on ? 'Installed' : 'Install'}
              </button>
            </div>
          )
        })}
        {shown.length === 0 && (
          <div className="col-span-full rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-10 text-center text-sm text-muted-foreground">
            <div className="text-2xl">🔍</div>
            No extensions found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
