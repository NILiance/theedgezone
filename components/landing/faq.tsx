'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FaqItem {
  q: string
  a: string
}

interface FaqProps {
  items: FaqItem[]
}

export function Faq({ items }: FaqProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <div className="divide-y divide-border rounded-[var(--radius)] border border-border bg-panel/60">
      {items.map((item, idx) => {
        const open = openIdx === idx
        return (
          <button
            key={item.q}
            type="button"
            onClick={() => setOpenIdx(open ? null : idx)}
            className="block w-full px-6 py-5 text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-display text-base font-bold text-foreground">
                {item.q}
              </span>
              <span
                aria-hidden
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center text-primary transition-transform',
                  open && 'rotate-180'
                )}
              >
                ▼
              </span>
            </div>
            {open && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
