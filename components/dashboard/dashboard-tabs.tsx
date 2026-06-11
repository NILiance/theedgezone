'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const TABS = [
  'Services',
  'Roadmap',
  'Resources',
  'Profile',
  'My Products',
  'Goals',
  'Points',
  'Orders',
  'For You',
  'Account',
  'Support',
  'Insights',
] as const

type Tab = (typeof TABS)[number]

interface DashboardTabsProps {
  defaultTab?: Tab
  panels: Partial<Record<Tab, React.ReactNode>>
}

export function DashboardTabs({ defaultTab = 'My Products', panels }: DashboardTabsProps) {
  const [active, setActive] = useState<Tab>(defaultTab)

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={cn(
              'text-display rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
              active === tab
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-panel/40 text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">{panels[active] ?? <ComingSoonPanel tab={active} />}</div>
    </div>
  )
}

function ComingSoonPanel({ tab }: { tab: Tab }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-10 text-center">
      <p className="text-eyebrow text-muted-foreground">{tab}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Coming soon &mdash; this tab is wired in but the module is still being built.
      </p>
    </div>
  )
}
