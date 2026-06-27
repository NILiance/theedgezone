'use client'

import { Button } from '@/components/ui/button'
import { type AppScreen, type NavItem, screenEmoji, MAX_NAV_ITEMS } from '@/lib/app-screens'

/**
 * Navigation tab — the bottom tab bar. Pick which screens appear, their order,
 * label, icon, and visibility. The first {MAX_NAV_ITEMS} visible become tabs
 * (legacy nav model: max 5).
 */
export function NavigationTab({
  screens,
  nav,
  onChange,
}: {
  screens: AppScreen[]
  nav: NavItem[]
  onChange: (nav: NavItem[]) => void
}) {
  const inNav = new Set(nav.map((n) => n.screen_id))
  const available = screens.filter((s) => !inNav.has(s.id))
  const visibleCount = nav.filter((n) => n.visible).length
  const screenName = (id: string) => screens.find((s) => s.id === id)?.title ?? '(deleted screen)'

  const add = (s: AppScreen) =>
    onChange([
      ...nav,
      { screen_id: s.id, label: s.title, icon: screenEmoji(s.icon), visible: visibleCount < MAX_NAV_ITEMS },
    ])
  const patch = (i: number, p: Partial<NavItem>) => onChange(nav.map((n, idx) => (idx === i ? { ...n, ...p } : n)))
  const remove = (i: number) => onChange(nav.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= nav.length) return
    const next = [...nav]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The bottom tab bar of your app. The first <strong>{MAX_NAV_ITEMS}</strong> visible items become
        the tabs — {visibleCount} visible now.
      </p>

      <div className="space-y-2">
        {nav.map((n, i) => (
          <div
            key={`${n.screen_id}-${i}`}
            className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-panel/40 p-2.5"
          >
            <span className="text-display rounded-[var(--radius-sm)] bg-panel-elevated px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              {i + 1}
            </span>
            <input
              value={n.icon}
              onChange={(e) => patch(i, { icon: e.target.value })}
              className="w-10 rounded-[var(--radius-sm)] border border-border bg-background px-1 py-1 text-center text-base"
              aria-label="Icon"
            />
            <input
              value={n.label}
              onChange={(e) => patch(i, { label: e.target.value })}
              className="min-w-[8rem] flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
            />
            <span className="text-[10px] text-muted-foreground">{screenName(n.screen_id)}</span>
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <input type="checkbox" checked={n.visible} onChange={(e) => patch(i, { visible: e.target.checked })} className="h-3.5 w-3.5 accent-primary" />
              Visible
            </label>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-muted-foreground disabled:opacity-30">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === nav.length - 1} className="px-1 text-muted-foreground disabled:opacity-30">↓</button>
            <button type="button" onClick={() => remove(i)} className="px-1.5 text-destructive">✕</button>
          </div>
        ))}
        {nav.length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No tabs yet. Add screens to the bar below.
          </p>
        )}
      </div>

      {available.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Add a screen to the bar</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {available.map((s) => (
              <Button key={s.id} size="sm" variant="outline" onClick={() => add(s)}>
                {screenEmoji(s.icon)} {s.title}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
