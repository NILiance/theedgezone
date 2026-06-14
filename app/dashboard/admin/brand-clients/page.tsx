import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Brand clients' }

export default async function BrandClientsPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: clients } = await supabase
    .from('brand_clients')
    .select('id, name, contact_email, company, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Brand clients</p>
          <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
            Brand-customer portal
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            External brand customers who access their pack via magic-link. They don&apos;t have a
            Supabase account.
          </p>
        </div>
        <Link href="/dashboard/admin/brand-clients/new">
          <Button>+ Add client</Button>
        </Link>
      </div>

      {(clients ?? []).length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No brand clients yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Company</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Added</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(clients ?? []).map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <Link
                      href={`/dashboard/admin/brand-clients/${c.id}`}
                      className="text-display font-bold hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{c.contact_email}</td>
                  <td className="px-3 py-3 text-xs">{c.company ?? '—'}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        c.status === 'active'
                          ? 'bg-success/20 text-success'
                          : 'bg-panel-elevated text-muted-foreground'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/dashboard/admin/brand-clients/${c.id}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
