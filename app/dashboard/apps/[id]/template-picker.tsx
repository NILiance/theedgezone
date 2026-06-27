'use client'

import { APP_TEMPLATES } from '@/lib/app-templates'
import { screenDef, type AppScreen } from '@/lib/app-screens'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

/** "Get Started" — pick a starter template (seeds screens) or start from scratch. */
export function TemplatePicker({
  onApply,
  onScratch,
}: {
  onApply: (screens: AppScreen[]) => void
  onScratch: () => void
}) {
  const apply = (types: string[]) => {
    const screens = types
      .map((type) => {
        const def = screenDef(type)
        if (!def) return null
        return {
          id: `${type}-${Math.random().toString(36).slice(2, 7)}`,
          title: def.defaultTitle,
          icon: def.icon,
          type,
          content: clone(def.defaultContent),
        } as AppScreen
      })
      .filter(Boolean) as AppScreen[]
    onApply(screens)
  }

  return (
    <div className="text-center">
      <h2 className="text-display text-2xl font-black">Get Started</h2>
      <p className="text-sm text-muted-foreground">Choose a template or start from scratch.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {APP_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => apply(t.screens)}
            className="rounded-[var(--radius)] border border-border bg-panel/40 p-5 text-center transition-colors hover:border-primary/40"
          >
            <div className="text-3xl">{t.icon}</div>
            <p className="text-display mt-2 font-bold">{t.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground/70">{t.screens.length} screens</p>
          </button>
        ))}
      </div>
      <button type="button" onClick={onScratch} className="text-display mt-5 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80">
        Start from scratch →
      </button>
    </div>
  )
}
