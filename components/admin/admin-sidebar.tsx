'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export const ADMIN_NAV: NavGroup[] = [
  {
    title: 'Platform Management',
    items: [
      { label: 'Platform', href: '/dashboard/admin/branding' },
      { label: 'Integrations', href: '/dashboard/admin/integrations' },
      { label: 'NILiance', href: '/dashboard/admin/niliance' },
      { label: 'Pricing', href: '/dashboard/admin/pricing' },
      { label: 'Enrollment', href: '/dashboard/admin/enrollment' },
      { label: 'App Defaults', href: '/dashboard/admin/app-defaults' },
    ],
  },
  {
    title: 'Content & Pages',
    items: [
      { label: 'Pages', href: '/dashboard/admin/pages' },
      { label: 'Resources', href: '/dashboard/admin/resources' },
      { label: 'Roadmap Builder', href: '/dashboard/admin/roadmap' },
      { label: 'Climb Studio', href: '/dashboard/admin/climb' },
    ],
  },
  {
    title: 'Products & Orders',
    items: [
      { label: 'Orders', href: '/dashboard/admin/orders' },
      { label: 'Payouts', href: '/dashboard/admin/payouts' },
      { label: 'Brand Designs', href: '/dashboard/admin/brands' },
      { label: 'Websites', href: '/dashboard/admin/websites' },
      { label: 'EPKs', href: '/dashboard/admin/epks' },
      { label: 'Apps', href: '/dashboard/admin/apps' },
      { label: 'Podcasts', href: '/dashboard/admin/podcasts' },
      { label: 'Stores', href: '/dashboard/admin/stores' },
    ],
  },
  {
    title: 'Users & Access',
    items: [
      { label: 'Users', href: '/dashboard/admin/users' },
      { label: 'Permissions', href: '/dashboard/admin/permissions' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Rewards Store', href: '/dashboard/admin/rewards' },
      { label: 'Tickets', href: '/dashboard/admin/tickets' },
    ],
  },
]

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
