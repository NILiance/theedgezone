import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'

const MODEL = 'claude-sonnet-4-6'

let client: Anthropic | null = null
function getClient(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  return client
}

export interface InsightStats {
  period_start: string
  period_end: string
  site_views_7d: number
  site_views_prev_7d: number
  views_delta_pct: number
  tips_received_cents: number
  merch_revenue_cents: number
  tier_revenue_cents: number
  shoutout_revenue_cents: number
  store_revenue_cents: number
  total_revenue_cents: number
  new_subscribers: number
  new_followers_total: number
  top_block_clicks: { block_id: string; clicks: number }[]
  short_link_top: { slug: string; clicks: number }[]
}

export interface InsightSummary {
  headline: string
  bullets: string[]
}

interface GatheredContext {
  stats: InsightStats
  siteName: string | null
  sport: string | null
  hasPodcast: boolean
}

async function gatherStats(userId: string): Promise<GatheredContext | null> {
  const supabase = createServiceClient()
  if (!supabase) return null

  const now = new Date()
  const endIso = now.toISOString()
  const startDate = new Date(now)
  startDate.setUTCDate(startDate.getUTCDate() - 7)
  const startIso = startDate.toISOString()
  const prevStartDate = new Date(startDate)
  prevStartDate.setUTCDate(prevStartDate.getUTCDate() - 7)
  const prevStartIso = prevStartDate.toISOString()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, sport')
    .eq('id', userId)
    .maybeSingle()

  const { data: sites } = await supabase.from('sites').select('id, display_name').eq('user_id', userId)
  const siteIds = (sites ?? []).map((s) => s.id)

  let views7d = 0
  let viewsPrev = 0
  let topBlockClicks: { block_id: string; clicks: number }[] = []
  let newSubscribers = 0
  let shortLinkTop: { slug: string; clicks: number }[] = []
  if (siteIds.length > 0) {
    const { count } = await supabase
      .from('site_events')
      .select('id', { count: 'exact', head: true })
      .in('site_id', siteIds)
      .eq('event_type', 'page_view')
      .gte('created_at', startIso)
    views7d = count ?? 0
    const { count: prevCount } = await supabase
      .from('site_events')
      .select('id', { count: 'exact', head: true })
      .in('site_id', siteIds)
      .eq('event_type', 'page_view')
      .gte('created_at', prevStartIso)
      .lt('created_at', startIso)
    viewsPrev = prevCount ?? 0
    const { data: blockEvents } = await supabase
      .from('site_events')
      .select('block_id')
      .in('site_id', siteIds)
      .eq('event_type', 'block_click')
      .gte('created_at', startIso)
    const blockMap = new Map<string, number>()
    for (const ev of blockEvents ?? []) {
      if (!ev.block_id) continue
      blockMap.set(ev.block_id, (blockMap.get(ev.block_id) ?? 0) + 1)
    }
    topBlockClicks = Array.from(blockMap.entries())
      .map(([block_id, clicks]) => ({ block_id, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
    const { count: subCount } = await supabase
      .from('site_subscribers')
      .select('id', { count: 'exact', head: true })
      .in('site_id', siteIds)
      .gte('created_at', startIso)
    newSubscribers = subCount ?? 0
    const { data: shortLinks } = await supabase
      .from('short_links')
      .select('slug, click_count')
      .in('site_id', siteIds)
      .order('click_count', { ascending: false })
      .limit(5)
    shortLinkTop = (shortLinks ?? []).map((l) => ({ slug: l.slug, clicks: l.click_count ?? 0 }))
  }

  let totalRevenue = 0
  let tipsRevenue = 0
  let merchRevenue = 0
  let tierRevenue = 0
  let shoutoutRevenue = 0
  if (siteIds.length > 0) {
    const { data: txs } = await supabase
      .from('site_transactions')
      .select('amount_cents, transaction_type')
      .in('site_id', siteIds)
      .eq('status', 'paid')
      .gte('created_at', startIso)
    for (const t of txs ?? []) {
      const amt = Number(t.amount_cents) ?? 0
      totalRevenue += amt
      if (t.transaction_type === 'tip') tipsRevenue += amt
      else if (t.transaction_type === 'merch') merchRevenue += amt
      else if (t.transaction_type === 'tier') tierRevenue += amt
      else if (t.transaction_type === 'shoutout') shoutoutRevenue += amt
    }
  }
  let storeRevenue = 0
  const { data: stores } = await supabase.from('stores').select('id').eq('user_id', userId)
  const storeIds = (stores ?? []).map((s) => s.id)
  if (storeIds.length > 0) {
    const { data: orders } = await supabase
      .from('store_orders')
      .select('amount_cents')
      .in('store_id', storeIds)
      .gte('created_at', startIso)
      .in('status', ['paid', 'fulfilled', 'shipped'])
    for (const o of orders ?? []) storeRevenue += Number(o.amount_cents) ?? 0
  }
  totalRevenue += storeRevenue

  const { data: podcastRow } = await supabase
    .from('podcasts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  const stats: InsightStats = {
    period_start: startIso.slice(0, 10),
    period_end: endIso.slice(0, 10),
    site_views_7d: views7d,
    site_views_prev_7d: viewsPrev,
    views_delta_pct:
      viewsPrev > 0 ? Math.round(((views7d - viewsPrev) / viewsPrev) * 100) : views7d > 0 ? 100 : 0,
    tips_received_cents: tipsRevenue,
    merch_revenue_cents: merchRevenue,
    tier_revenue_cents: tierRevenue,
    shoutout_revenue_cents: shoutoutRevenue,
    store_revenue_cents: storeRevenue,
    total_revenue_cents: totalRevenue,
    new_subscribers: newSubscribers,
    new_followers_total: 0,
    top_block_clicks: topBlockClicks,
    short_link_top: shortLinkTop,
  }

  return {
    stats,
    siteName: (sites ?? [])[0]?.display_name ?? profile?.display_name ?? null,
    sport: profile?.sport ?? null,
    hasPodcast: (podcastRow ?? []).length > 0,
  }
}

async function summarize(ctx: GatheredContext): Promise<InsightSummary> {
  const c = getClient()
  const fallback: InsightSummary = {
    headline:
      ctx.stats.total_revenue_cents > 0
        ? `You earned $${(ctx.stats.total_revenue_cents / 100).toFixed(0)} this week — keep the momentum.`
        : ctx.stats.site_views_7d > 0
        ? `Your site got ${ctx.stats.site_views_7d} views this week.`
        : 'Slow week — let’s change that next.',
    bullets: [
      ctx.stats.views_delta_pct >= 0
        ? `Page views ${ctx.stats.views_delta_pct >= 0 ? 'up' : 'down'} ${Math.abs(ctx.stats.views_delta_pct)}% vs prior week.`
        : `Views dipped ${Math.abs(ctx.stats.views_delta_pct)}% — try a new short link or share a post.`,
      ctx.stats.new_subscribers > 0
        ? `${ctx.stats.new_subscribers} new subscribers joined your list.`
        : 'No new subscribers — add a CTA block to your site if you haven’t already.',
      ctx.stats.top_block_clicks[0]
        ? `Your top clicked block this week was "${ctx.stats.top_block_clicks[0].block_id}".`
        : 'No block clicks recorded — check that your block analytics tracker is firing.',
    ],
  }
  if (!c) return fallback
  try {
    const prompt = `You are summarizing one week of activity for an athlete using a personal-brand platform.

Context:
- Athlete${ctx.sport ? `, sport: ${ctx.sport}` : ''}
- Site name: ${ctx.siteName ?? 'their site'}
- Has podcast: ${ctx.hasPodcast ? 'yes' : 'no'}

Stats (JSON):
${JSON.stringify(ctx.stats, null, 2)}

Write a friendly, specific weekly insight email summary:
- Headline: one sentence, under 14 words, captures the headline number or biggest movement.
- 3 bullets, each under 22 words. Use the stats. Be specific. If a number is zero or negative, still write something useful — a coaching tip or next action.
- Never use the word "AI". No emojis. No clichés ("crushing it", "to the moon").

Return ONLY JSON of shape: {"headline": "...", "bullets": ["...","...","..."]}`
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n')
      .trim()
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const parsed = JSON.parse(stripped) as InsightSummary
    if (!parsed.headline || !Array.isArray(parsed.bullets)) return fallback
    return parsed
  } catch {
    return fallback
  }
}

export async function generateInsightForUser(userId: string): Promise<
  | { ok: true; insightId: string; stats: InsightStats; summary: InsightSummary }
  | { ok: false; error: string }
> {
  const ctx = await gatherStats(userId)
  if (!ctx) return { ok: false, error: 'Service role key missing' }
  const summary = await summarize(ctx)
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, error: 'Service role key missing' }
  const { data, error } = await supabase
    .from('weekly_insights')
    .upsert(
      {
        user_id: userId,
        period_start: ctx.stats.period_start,
        period_end: ctx.stats.period_end,
        headline: summary.headline,
        bullets: summary.bullets,
        stats: ctx.stats,
      },
      { onConflict: 'user_id,period_start' }
    )
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, insightId: data.id, stats: ctx.stats, summary }
}
