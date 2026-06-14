import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'My opportunities' }

export default async function MyOpportunitiesPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, status, audience, price_cents, listing_uuid, created_at')
    .eq('posted_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <h1 className="text-display mt-3 text-3xl font-black tracking-tight">
            My opportunities
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand deals you&apos;ve posted. Listings sync to NILiance Marketplace when published
            with sync enabled.
          </p>
        </div>
        <Link href="/dashboard/opportunities/new">
          <Button>+ Post opportunity</Button>
        </Link>
      </div>

      {(opportunities ?? []).length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          You haven&apos;t posted anything yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Audience</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Posted</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(opportunities ?? []).map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="text-display font-bold">{o.title}</p>
                    {o.listing_uuid && (
                      <p className="text-[10px] text-muted-foreground">
                        Synced to NILiance
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">
                    {o.audience}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary">
                    {o.price_cents != null && o.price_cents > 0
                      ? `$${(o.price_cents / 100).toFixed(0)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        o.status === 'published'
                          ? 'bg-success/20 text-success'
                          : o.status === 'closed'
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-panel-elevated text-muted-foreground'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/opportunities/${o.id}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Edit →
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
