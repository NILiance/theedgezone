/**
 * Admin sidebar navigation config.
 *
 * Kept in a plain (non-'use client') module so it can be imported by both
 * the server-rendered admin overview page and the client-side sidebar
 * without crossing the React-Server-Components boundary.
 */
export interface AdminNavItem {
  label: string
  href: string
}

export interface AdminNavGroup {
  title: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
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
      { label: 'Brand Revisions', href: '/dashboard/admin/brand-revisions' },
      { label: 'Websites', href: '/dashboard/admin/websites' },
      { label: 'EPKs', href: '/dashboard/admin/epks' },
      { label: 'Apps', href: '/dashboard/admin/apps' },
      { label: 'Podcasts', href: '/dashboard/admin/podcasts' },
      { label: 'Stores', href: '/dashboard/admin/stores' },
      { label: 'Trading Cards', href: '/dashboard/admin/trading-cards' },
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
  {
    title: 'System',
    items: [
      { label: 'Setup Checklist', href: '/dashboard/admin/setup' },
      { label: 'Suppliers', href: '/dashboard/admin/suppliers' },
      { label: 'Migrations', href: '/dashboard/admin/migrations' },
    ],
  },
]
