import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatEasternDate } from '@/lib/format-date'

export const metadata = { title: 'Payouts' }

export default async function AdminPayoutsPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }

  const [{ data: payouts }, { data: profiles }] = await Promise.all([
    supabase
      .from('talent_payouts')
      .select('id, user_id, amount_cents, currency, status, arrival_date, created_at, stripe_payout_id, failure_message')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('profiles')
      .select('id, display_name, stripe_connect_account_id, stripe_connect_status, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_onboarded_at')
      .not('stripe_connect_account_id', 'is', null),
  ])

  const userIds = Array.from(
    new Set([
      ...(payouts ?? []).map((p) => p.user_id),
      ...(profiles ?? []).map((p) => p.id),
    ])
  ).filter(Boolean)
  const emailById = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email)
    }
  }
  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const totalPaid = (payouts ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + (Number(p.amount_cents) ?? 0), 0)
  const pendingCount = (payouts ?? []).filter((p) => p.status === 'pending' || p.status === 'in_transit').length
  const failedCount = (payouts ?? []).filter((p) => p.status === 'failed').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Payouts</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Talent payouts</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Stripe Connect Express payouts to talents. Platform takes 15% on every paid charge.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Total paid" value={`$${(totalPaid / 100).toFixed(0)}`} />
        <Tile label="Pending" value={pendingCount.toString()} />
        <Tile label="Failed" value={failedCount.toString()} />
        <Tile label="Connected" value={(profiles ?? []).filter((p) => p.stripe_connect_charges_enabled).length.toString()} />
      </div>

      <section>
        <p className="text-eyebrow mb-3 text-primary">Connect accounts</p>
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Talent</th>
                <th className="px-3 py-2 text-left">Account ID</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Charges</th>
                <th className="px-3 py-2 text-left">Payouts</th>
                <th className="px-3 py-2 text-left">Onboarded</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 text-xs">
                    {p.display_name ?? '—'}
                    {emailById.get(p.id) && <p className="text-muted-foreground">{emailById.get(p.id)}</p>}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px]">{p.stripe_connect_account_id}</td>
                  <td className="px-3 py-2 text-xs uppercase tracking-widest">{p.stripe_connect_status ?? 'pending'}</td>
                  <td className="px-3 py-2 text-xs">{p.stripe_connect_charges_enabled ? '✓' : '—'}</td>
                  <td className="px-3 py-2 text-xs">{p.stripe_connect_payouts_enabled ? '✓' : '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {p.stripe_connect_onboarded_at ? formatEasternDate(p.stripe_connect_onboarded_at) : '—'}
                  </td>
                </tr>
              ))}
              {(profiles ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No Connect accounts onboarded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <p className="text-eyebrow mb-3 text-primary">Recent payouts</p>
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Talent</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Arrival</th>
              </tr>
            </thead>
            <tbody>
              {(payouts ?? []).map((p) => {
                const profile = profilesById.get(p.user_id) ?? null
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-2 text-xs">{formatEasternDate(p.created_at)}</td>
                    <td className="px-3 py-2 text-xs">{profile?.display_name ?? emailById.get(p.user_id) ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-bold text-primary">
                      ${(Number(p.amount_cents) / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          p.status === 'paid'
                            ? 'bg-success/20 text-success'
                            : p.status === 'failed'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-panel-elevated text-muted-foreground'
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.failure_message && (
                        <p className="mt-1 text-[10px] text-destructive" title={p.failure_message}>
                          {p.failure_message.slice(0, 40)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {p.arrival_date ? formatEasternDate(p.arrival_date) : '—'}
                    </td>
                  </tr>
                )
              })}
              {(payouts ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No payouts yet. They start landing once talents earn revenue via Connect.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className="text-display mt-1 text-2xl font-black text-primary">{value}</p>
    </div>
  )
}
