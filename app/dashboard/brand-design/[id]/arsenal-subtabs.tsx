'use client'

import Link from 'next/link'
import { SUBTAB_GROUP, type ArsenalSubtab } from './arsenal-subtab-meta'

// Re-export the type so existing client importers keep working.
export type { ArsenalSubtab }

const TABS: Array<{ id: ArsenalSubtab; label: string }> = [
  { id: 'create', label: 'Create' },
  { id: 'visual', label: 'Visual Assets' },
  { id: 'comms', label: 'Communications' },
  { id: 'print', label: 'Print' },
  { id: 'digital', label: 'Digital' },
  { id: 'brand_toolkit', label: 'Brand Toolkit' },
]

// Six leaf tabs — clicking a group tab loads its card grid below (no dropdown
// menus). When you're inside an item generator, the parent group tab lights up.
export function ArsenalSubtabs({
  brandId,
  active,
}: {
  brandId: string
  active: ArsenalSubtab
}) {
  const activeGroup = SUBTAB_GROUP[active]
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40">
      <ul className="flex flex-wrap items-stretch gap-1 p-1">
        {TABS.map((t) => {
          const isActive = active === t.id || activeGroup === t.id
          return (
            <li key={t.id} className="min-w-[120px] flex-1">
              <Link href={hrefFor(brandId, t.id)} scroll={false} className={tabClass(isActive)}>
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function tabClass(isActive: boolean): string {
  return `text-display flex h-12 w-full items-center justify-center rounded-[var(--radius-sm)] px-3 text-center text-[11px] font-bold uppercase tracking-widest transition-colors ${
    isActive
      ? 'border-2 border-primary bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-panel/40 hover:text-foreground'
  }`
}

function hrefFor(brandId: string, id: ArsenalSubtab): string {
  return `/dashboard/brand-design/${brandId}?view=arsenal&arsenalsubtab=${id}`
}
