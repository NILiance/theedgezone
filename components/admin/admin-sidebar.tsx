'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ADMIN_NAV } from '@/components/admin/admin-nav-config'

export { ADMIN_NAV } from '@/components/admin/admin-nav-config'

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="space-y-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.title}>
          <p className="text-eyebrow mb-2 text-muted-foreground">{group.title}</p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/15 font-bold text-primary'
                        : 'text-muted-foreground hover:bg-panel-elevated hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
}
