import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'

const ADMIN_LINKS = [
  { label: 'Branding', href: '/dashboard/admin/branding' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-eyebrow text-accent">Admin</p>
          <h1 className="text-display mt-2 text-3xl font-black tracking-tight">
            Platform Settings
          </h1>
        </div>
      </div>
      <div className="flex gap-2 border-b border-border">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-display rounded-t-md border-b-2 border-transparent px-4 py-2 text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div>{children}</div>
    </div>
  )
}
