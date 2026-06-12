'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

interface AccountMenuProps {
  displayName: string
  isAdmin: boolean
}

const ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profile', href: '/dashboard/profile' },
  { label: 'My Sites', href: '/dashboard/sites' },
  { label: 'Brand Design', href: '/dashboard/brand-design' },
]

export function AccountMenu({ displayName, isAdmin }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onClick)
      return () => document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const short =
    displayName.length > 24 ? `${displayName.slice(0, 22)}…` : displayName

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {short} <span className="ml-1 opacity-70">▾</span>
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-[var(--radius-sm)] border border-border bg-panel shadow-elevated"
        >
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-foreground/90 transition-colors hover:bg-panel-elevated hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-2 text-sm text-primary transition-colors hover:bg-panel-elevated"
            >
              Admin
            </Link>
          )}
          <form action={signOut} className="border-t border-border">
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-destructive transition-colors hover:bg-panel-elevated"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
