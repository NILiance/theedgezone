import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PLATFORM_FEE_BPS } from '@/lib/stripe-connect'
import { ConnectActions } from './connect-actions'

export const metadata = { title: 'Payouts' }

interface PageProps {
  searchParams: Promise<{ completed?: string; refreshed?: string }>
}

export default async function PayoutsPage({ searchParams }: PageProps) {
  const user = await requireUser()
  const sp = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'stripe_connect_account_id, stripe_connect_status, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted, stripe_connect_onboarded_at'
    )
    .eq('id', user.id)
    .maybeSingle()

  const { data: payouts } = await supabase
    .from('talent_payouts')
    .select('id, amount_cents, currency, status, arrival_date, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: txnsAgg } = await supabase
    .from('site_transactions')
    .select('amount_cents, status, sites!inner(user_id)')
    .eq('sites.user_id', user.id)

  const lifetimeGross = (txnsAgg ?? [])
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + (t.amount_cents ?? 0), 0)
  const lifetimeNet = lifetimeGross - Math.round((lifetimeGross * PLATFORM_FEE_BPS) / 10000)

  const status = profile?.stripe_connect_status ?? null
  const isActive = profile?.stripe_connect_charges_enabled && profile?.stripe_connect_payouts_enabled

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="text-display mt-3 text-3xl font-black tracking-tight">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get paid for everything fans buy on your site — tips, memberships, merch, shoutouts.
          Platform fee {(PLATFORM_FEE_BPS / 100).toFixed(0)}%; everything else is yours.
        </p>
      </div>

      {sp.completed === '1' && (
        <div className="rounded-[var(--radius)] border border-success/40 bg-success/5 p-4">
          <p className="text-sm text-success">
            ✓ Stripe says onboarding is complete. Hit <strong>Refresh status</strong> below to pull
            the latest from Stripe.
          </p>
        </div>
      )}
      {sp.refreshed === '1' && (
        <div className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4">
          <p className="text-sm text-accent">
            Onboarding paused. Restart whenever you&apos;re ready.
          </p>
        </div>
      )}

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Connect status</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <StatusRow label="Status" value={statusLabel(status, isActive)} />
          <StatusRow
            label="Charges enabled"
            value={profile?.stripe_connect_charges_enabled ? 'Yes' : 'No'}
          />
          <StatusRow
            label="Payouts enabled"
            value={profile?.stripe_connect_payouts_enabled ? 'Yes' : 'No'}
          />
          <StatusRow
            label="Details submitted"
            value={profile?.stripe_connect_details_submitted ? 'Yes' : 'No'}
          />
        </div>
        <div className="mt-4">
          <ConnectActions
            hasAccount={Boolean(profile?.stripe_connect_account_id)}
            isActive={Boolean(isActive)}
          />
        </div>
        {!isActive && (
          <p className="mt-3 text-xs text-muted-foreground">
            Until onboarding is complete, anything fans pay on your site stays in the platform
            account. No refunds happen automatically — we&apos;ll route held funds to your Connect
            account on first payout once active.
          </p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Lifetime sales" value={`$${(lifetimeGross / 100).toFixed(0)}`} />
        <Tile
          label="After platform fee"
          value={`$${(lifetimeNet / 100).toFixed(0)}`}
          sub={`(${(100 - PLATFORM_FEE_BPS / 100).toFixed(0)}% to you)`}
        />
        <Tile
          label="Payouts received"
          value={`$${((payouts ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount_cents ?? 0), 0) / 100).toFixed(0)}`}
        />
      </div>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40">
        <p className="text-eyebrow border-b border-border px-5 py-4 text-primary">Recent payouts</p>
        {(payouts ?? []).length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No payouts yet. They start landing here once Stripe processes them — usually 2 business
            days after a sale.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-2 text-left">Date</th>
                <th className="px-5 py-2 text-right">Amount</th>
                <th className="px-5 py-2 text-left">Status</th>
                <th className="px-5 py-2 text-left">Arrival</th>
              </tr>
            </thead>
            <tbody>
              {(payouts ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-2 text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-2 text-right font-bold text-primary">
                    ${(Number(p.amount_cents ?? 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-2 text-xs uppercase tracking-widest">{p.status}</td>
                  <td className="px-5 py-2 text-xs text-muted-foreground">
                    {p.arrival_date ? new Date(p.arrival_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function statusLabel(status: string | null, isActive: boolean | undefined): string {
  if (isActive) return 'Active'
  if (!status) return 'Not started'
  if (status === 'pending') return 'Awaiting onboarding'
  if (status === 'restricted') return 'Action needed'
  if (status === 'disabled') return 'Disabled — contact support'
  return status
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className="text-display mt-1 text-2xl font-black text-primary">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
