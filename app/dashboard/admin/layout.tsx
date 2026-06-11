import { requireAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-accent">Admin</p>
        <h1 className="text-display mt-2 text-3xl font-black tracking-tight">
          Platform Management
        </h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
