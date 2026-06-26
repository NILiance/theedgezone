'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { redeemReward } from './actions'

export interface RewardItem {
  id: string
  name: string
  description: string | null
  image_url: string | null
  points_cost: number
  stock: number | null
  status: string
}
export interface Redemption {
  id: string
  reward_item_id: string
  points_spent: number
  status: string
  created_at: string
}
export interface LedgerEntry {
  id: string
  delta: number
  reason: string
  created_at: string
}

const REASON_LABEL: Record<string, string> = {
  signup_bonus: 'Signup bonus',
  profile_complete: 'Profile completed',
  daily_login: 'Daily check-in',
  purchase: 'Purchase reward',
  redemption: 'Redeemed reward',
  admin_adjust: 'Admin adjustment',
}

export function RewardsClient({
  balance,
  items,
  redemptions,
  ledger,
}: {
  balance: number
  items: RewardItem[]
  redemptions: Redemption[]
  ledger: LedgerEntry[]
}) {
  const router = useRouter()
  const [bal, setBal] = useState(balance)
  const [isPending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

  const itemsById = new Map(items.map((i) => [i.id, i]))

  const redeem = (item: RewardItem) => {
    if (!confirm(`Redeem "${item.name}" for ${item.points_cost.toLocaleString()} points?`)) return
    setBusyId(item.id)
    setMsg(null)
    startTransition(async () => {
      const res = await redeemReward(item.id)
      setBusyId(null)
      if (res.ok) {
        if (typeof res.balance === 'number') setBal(res.balance)
        setMsg({ id: item.id, text: 'Redeemed! Check your history below.', ok: true })
        router.refresh()
      } else {
        if (typeof res.balance === 'number') setBal(res.balance)
        setMsg({ id: item.id, text: res.message ?? 'Could not redeem', ok: false })
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-accent">Rewards</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">Rewards store</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn points by staying active, then redeem them for perks.
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/10 px-5 py-3 text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your balance</p>
          <p className="text-display text-3xl font-black text-primary">{bal.toLocaleString()}</p>
        </div>
      </div>

      {/* How to earn */}
      <div className="grid gap-2 rounded-[var(--radius)] border border-border bg-panel/40 p-4 text-xs text-muted-foreground sm:grid-cols-4">
        {[
          ['Daily check-in', '+10 / day'],
          ['Complete your profile', '+250 once'],
          ['Make a purchase', '+5 / $1'],
          ['Welcome bonus', '+100 once'],
        ].map(([label, val]) => (
          <div key={label} className="rounded-[var(--radius-sm)] bg-panel-elevated/40 p-3">
            <p className="font-bold text-foreground">{val}</p>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {/* Store */}
      <section>
        <p className="text-eyebrow mb-3 text-primary">Redeem</p>
        {items.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-8 text-center text-sm text-muted-foreground">
            No rewards available right now. Check back soon.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const soldOut = typeof item.stock === 'number' && item.stock <= 0
              const tooPoor = bal < item.points_cost
              return (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40"
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-panel-elevated/40 text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-display font-bold">{item.name}</p>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-display text-lg font-black text-primary">
                        {item.points_cost.toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">pts</span>
                      {typeof item.stock === 'number' && (
                        <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
                          {item.stock} left
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <Button
                        onClick={() => redeem(item)}
                        disabled={isPending || soldOut || tooPoor}
                        className="w-full"
                        size="sm"
                      >
                        {busyId === item.id
                          ? 'Redeeming…'
                          : soldOut
                          ? 'Sold out'
                          : tooPoor
                          ? `Need ${(item.points_cost - bal).toLocaleString()} more`
                          : 'Redeem'}
                      </Button>
                    </div>
                    {msg?.id === item.id && (
                      <p className={`mt-2 text-[11px] ${msg.ok ? 'text-success' : 'text-destructive'}`}>
                        {msg.text}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Redemption history */}
        <section>
          <p className="text-eyebrow mb-3 text-primary">Your redemptions</p>
          {redemptions.length === 0 ? (
            <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing redeemed yet.
            </p>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
              {redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <p className="font-bold">{itemsById.get(r.reward_item_id)?.name ?? 'Reward'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()} · −{r.points_spent.toLocaleString()} pts
                    </p>
                  </div>
                  <span
                    className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      r.status === 'fulfilled'
                        ? 'bg-success/20 text-success'
                        : r.status === 'cancelled'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-accent/20 text-accent'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Points ledger */}
        <section>
          <p className="text-eyebrow mb-3 text-primary">Points activity</p>
          {ledger.length === 0 ? (
            <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-6 text-center text-sm text-muted-foreground">
              No activity yet.
            </p>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
              {ledger.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <p className="font-bold">{REASON_LABEL[l.reason] ?? l.reason}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`font-bold ${l.delta >= 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    {l.delta >= 0 ? '+' : ''}
                    {l.delta.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
