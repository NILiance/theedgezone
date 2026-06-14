import { requireUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { generateInsightForUser } from '@/lib/insights'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const metadata = { title: 'Weekly Insights' }

async function generateNow() {
  'use server'
  const user = await requireUser()
  await generateInsightForUser(user.id)
  revalidatePath('/dashboard/insights')
}

export default async function InsightsPage() {
  const user = await requireUser()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: insights } = await supabase
    .from('weekly_insights')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false })
    .limit(12)

  const latest = (insights ?? [])[0]
  const stats = (latest?.stats as Record<string, number> | undefined) ?? null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <p className="text-eyebrow mt-3 text-primary">Weekly insights</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
            What happened this week
          </h1>
        </div>
        <form action={generateNow}>
          <button
            type="submit"
            className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground"
          >
            Generate now
          </button>
        </form>
      </div>

      {!latest && (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No insights yet — hit <span className="text-display font-bold">Generate now</span> to
            create your first one.
          </p>
        </div>
      )}

      {latest && (
        <article className="rounded-[var(--radius)] border border-border bg-panel/60 p-8 shadow-elevated">
          <p className="text-eyebrow text-primary">
            {String(latest.period_start)} → {String(latest.period_end)}
          </p>
          <h2 className="text-display mt-2 text-2xl font-black leading-tight">{latest.headline}</h2>
          {stats && (
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <Tile
                label="Page views"
                value={stats.site_views_7d?.toString() ?? '0'}
                delta={`${stats.views_delta_pct >= 0 ? '+' : ''}${stats.views_delta_pct}%`}
                deltaPositive={stats.views_delta_pct >= 0}
              />
              <Tile
                label="Revenue"
                value={`$${((stats.total_revenue_cents ?? 0) / 100).toFixed(0)}`}
              />
              <Tile label="New subs" value={(stats.new_subscribers ?? 0).toString()} />
              <Tile label="Top clicks" value={String(stats.top_block_clicks ? '' : '0')} />
            </div>
          )}
          <ul className="mt-6 space-y-3 text-sm leading-relaxed">
            {(latest.bullets as string[]).map((b, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-display font-black text-primary">→</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </article>
      )}

      {(insights ?? []).length > 1 && (
        <section>
          <p className="text-eyebrow mb-3 text-primary">Previous weeks</p>
          <div className="space-y-2">
            {(insights ?? []).slice(1).map((i) => (
              <div
                key={i.id}
                className="rounded-[var(--radius)] border border-border bg-panel/40 p-4"
              >
                <p className="font-mono text-[10px] text-muted-foreground">
                  {String(i.period_start)} → {String(i.period_end)}
                </p>
                <p className="text-display mt-1 font-bold">{i.headline}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Tile({
  label,
  value,
  delta,
  deltaPositive,
}: {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-background/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className="text-display mt-1 text-2xl font-black text-primary">{value}</p>
      {delta && (
        <p
          className={`mt-1 text-xs font-bold ${
            deltaPositive ? 'text-success' : 'text-destructive'
          }`}
        >
          {delta}
        </p>
      )}
    </div>
  )
}
