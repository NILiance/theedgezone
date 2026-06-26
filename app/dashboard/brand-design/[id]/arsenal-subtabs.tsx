'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { ArsenalSubtab } from './arsenal-subtab-meta'

// Re-export the type so existing client importers keep working. The runtime
// value (FOCUSED_CATEGORY_SUBTABS) intentionally lives in arsenal-subtab-meta
// so Server Components can call array methods on it — see that file.
export type { ArsenalSubtab }

type LeafEntry = { kind: 'leaf'; id: ArsenalSubtab; label: string }
type GroupEntry = {
  kind: 'group'
  id: string
  label: string
  items: Array<{ id: ArsenalSubtab; label: string }>
}
type NavEntry = LeafEntry | GroupEntry

const NAV: NavEntry[] = [
  { kind: 'leaf', id: 'create', label: 'Create' },
  {
    kind: 'group',
    id: 'visual',
    label: 'Visual Assets',
    items: [
      { id: 'logo_animation', label: 'Logo Animation' },
      { id: 'trading_card', label: 'Trading Card' },
      { id: 'social_avatars', label: 'Social Avatars' },
    ],
  },
  {
    kind: 'group',
    id: 'comms',
    label: 'Comms',
    items: [
      { id: 'brand_voice', label: 'Brand Voice' },
      { id: 'email_signature', label: 'Email Signature (HTML)' },
      { id: 'qr_code', label: 'QR Code' },
    ],
  },
  {
    kind: 'group',
    id: 'print',
    label: 'Print',
    items: [
      { id: 'business_card', label: 'Business Card' },
      { id: 'letterhead', label: 'Letterhead' },
      { id: 'thank_you_card', label: 'Thank You Card' },
      { id: 'presentation', label: 'Presentation Template' },
      { id: 'media_kit', label: 'Media Kit Cover' },
    ],
  },
  {
    kind: 'group',
    id: 'digital',
    label: 'Digital',
    items: [
      { id: 'social_media', label: 'Social Media' },
      { id: 'phone_wallpaper', label: 'Phone Wallpaper' },
      { id: 'story_highlight', label: 'Story Highlight Covers' },
      { id: 'virtual_background', label: 'Virtual Background' },
      { id: 'email_signature_image', label: 'Signature Graphic' },
      { id: 'icon_generator', label: 'Icon Generator' },
      { id: 'game_day', label: 'Game Day' },
    ],
  },
  { kind: 'leaf', id: 'brand_toolkit', label: 'Brand Toolkit' },
]

const ALL_LEAVES: Array<{ id: ArsenalSubtab; label: string }> = NAV.flatMap((e) =>
  e.kind === 'leaf' ? [{ id: e.id, label: e.label }] : e.items
)

export function ArsenalSubtabs({
  brandId,
  active,
}: {
  brandId: string
  active: ArsenalSubtab
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openGroup) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroup(null)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [openGroup])

  return (
    <div
      ref={rootRef}
      className="relative rounded-[var(--radius)] border border-border bg-panel/40"
    >
      <ul className="flex flex-wrap items-stretch gap-1 p-1">
        {NAV.map((entry) => {
          if (entry.kind === 'leaf') {
            const isActive = entry.id === active
            return (
              <li key={entry.id} className="flex-1 min-w-[110px]">
                <Link
                  href={hrefFor(brandId, entry.id)}
                  scroll={false}
                  onClick={() => setOpenGroup(null)}
                  className={tabClass(isActive)}
                >
                  {entry.label}
                </Link>
              </li>
            )
          }
          const activeChild = entry.items.find((i) => i.id === active)
          const isGroupActive = Boolean(activeChild)
          const isOpen = openGroup === entry.id
          return (
            <li key={entry.id} className="relative flex-1 min-w-[160px]">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : entry.id)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={`${tabClass(isGroupActive)} w-full justify-between gap-2`}
              >
                <span className="truncate">
                  {entry.label}
                  {activeChild && (
                    <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-primary/80">
                      · {activeChild.label}
                    </span>
                  )}
                </span>
                <Chevron open={isOpen} />
              </button>
              {isOpen && (
                <ul
                  role="menu"
                  className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 overflow-hidden rounded-[var(--radius)] border border-border bg-panel-elevated shadow-2xl"
                >
                  {entry.items.map((item) => {
                    const itemActive = item.id === active
                    return (
                      <li key={item.id} role="none">
                        <Link
                          href={hrefFor(brandId, item.id)}
                          scroll={false}
                          role="menuitem"
                          onClick={() => setOpenGroup(null)}
                          className={`text-display flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                            itemActive
                              ? 'bg-primary/15 text-primary'
                              : 'text-muted-foreground hover:bg-panel/60 hover:text-foreground'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              itemActive ? 'bg-primary' : 'bg-border'
                            }`}
                          />
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function tabClass(isActive: boolean): string {
  return `text-display flex h-12 w-full items-center justify-center rounded-[var(--radius-sm)] px-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
    isActive
      ? 'border-2 border-primary bg-primary/10 text-primary'
      : 'text-muted-foreground hover:text-foreground hover:bg-panel/40'
  }`
}

function hrefFor(brandId: string, id: ArsenalSubtab): string {
  return `/dashboard/brand-design/${brandId}?view=arsenal&arsenalsubtab=${id}`
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export { ALL_LEAVES as ARSENAL_SUBTABS }
