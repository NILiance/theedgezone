import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { ClientForm } from '../client-form'

export const metadata = { title: 'New brand client' }

export default async function NewBrandClientPage() {
  await requireAdmin()
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/brand-clients"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Brand clients
        </Link>
        <h1 className="text-display mt-3 text-3xl font-black tracking-tight">
          Add a brand client
        </h1>
      </div>
      <ClientForm initial={{ status: 'active' }} isEdit={false} />
    </div>
  )
}
