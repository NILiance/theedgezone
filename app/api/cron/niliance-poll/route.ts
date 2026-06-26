import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { listSharetribeOpportunities } from '@/lib/opportunities'
import { pullProfileFromNiliance } from '@/lib/niliance'

/**
 * NILiance inbound poll — Vercel cron target.
 *
 * Runs two jobs per invocation:
 *   1. Profile sync: pull latest user data from Sharetribe for the next
 *      batch of linked users (cursor-paginated by profile UUID).
 *   2. Opportunity sync: refresh the opportunities cache from Sharetribe
 *      Marketplace listings.
 *
 * Both jobs no-op gracefully when:
 *   - Sharetribe SDK creds missing → returns "skipped: not configured"
 *   - Service role missing → returns "skipped: no service client"
 *
 * Schedule from vercel.json. Authorize via CRON_SECRET env var matching the
 * Vercel cron Bearer token, or rely on Vercel's automatic auth.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Vercel adds Authorization: Bearer <CRON_SECRET> automatically when
  // cron jobs are configured. Allow local /api/cron/niliance-poll for
  // manual testing if no CRON_SECRET set.
  const auth = request.headers.get('authorization') ?? ''
  if (env.CRON_SECRET) {
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'no service client' })
  }

  const result = {
    user_sync: { processed: 0, errors: 0 },
    opp_sync: { fetched: 0, upserted: 0, skipped: false },
  }

  // ── Job 1: opportunity cache sync ────────────────────────────────────
  try {
    const listings = await listSharetribeOpportunities(100)
    result.opp_sync.fetched = listings.length

    for (const l of listings) {
      // Upsert by Sharetribe UUID. Skip closed/draft.
      const status =
        l.state === 'published'
          ? 'published'
          : l.state === 'closed' || l.state === 'pendingApproval'
          ? 'closed'
          : 'draft'

      const category =
        typeof l.publicData?.category === 'string' ? (l.publicData.category as string) : null

      const { error } = await supabase
        .from('opportunities')
        .upsert(
          {
            listing_uuid: l.uuid,
            title: l.title,
            description: l.description,
            category,
            status,
            price_cents: l.price?.amount ?? null,
            currency: l.price?.currency?.toLowerCase() ?? 'usd',
            posted_by_uuid: l.authorUuid ?? null,
            audience: 'talent',
            cached_at: new Date().toISOString(),
          },
          { onConflict: 'listing_uuid' }
        )
      if (!error) result.opp_sync.upserted++
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown opp sync error'
    result.opp_sync.skipped = true
    await supabase
      .from('niliance_poll_state')
      .update({ last_error: msg, last_opp_poll: new Date().toISOString() })
      .eq('id', 1)
  }

  await supabase
    .from('niliance_poll_state')
    .update({ last_opp_poll: new Date().toISOString() })
    .eq('id', 1)

  // ── Job 2: user profile inbound sync ────────────────────────────────
  // Pull NILiance data into the profiles of linked users that are still
  // sparse (no sport yet). Bounded to 25 per tick; a profile drops out of
  // the query once it has data, so this self-limits.
  try {
    const { data: linked } = await supabase
      .from('profiles')
      .select('id, niliance_user_id')
      .or('niliance_user_id.not.is.null,niliance_link_status.eq.linked')
      .is('sport', null)
      .limit(25)

    for (const u of linked ?? []) {
      try {
        const res = await pullProfileFromNiliance({
          userId: u.id,
          stUserId: (u as { niliance_user_id?: string | null }).niliance_user_id ?? null,
        })
        if (res.ok) result.user_sync.processed += 1
        else result.user_sync.errors += 1
      } catch {
        result.user_sync.errors += 1
      }
    }
  } catch {
    // Non-fatal — opportunity sync above is the primary job.
  }

  await supabase
    .from('niliance_poll_state')
    .update({ last_user_poll: new Date().toISOString() })
    .eq('id', 1)

  return NextResponse.json({ ok: true, result })
}
