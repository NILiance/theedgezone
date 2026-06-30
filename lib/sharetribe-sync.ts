/**
 * Claude → Sharetribe durable sync (Phase 1: users).
 *
 * Replaces fire-and-forget Sharetribe writes with the guide's outbox pattern:
 *   enqueueSyncEvent()  → durable row in sharetribe_sync_outbox
 *   processOutbox()     → resolves the Sharetribe id (sharetribe_links), calls
 *                         the write, verifies, marks synced or backoff-retries.
 * The /api/cron/sharetribe-sync reconciliation job drains anything that failed.
 *
 * Phase 1 reuses the existing NILiance user functions; listings, stock,
 * associations, transactions, and referrals are added in later phases (see
 * docs/niliance-sharetribe-sync.md).
 */
import { randomBytes } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import {
  createNilianceUser,
  syncProfile,
  resolveNilianceUserId,
  logEvent,
} from '@/lib/niliance'
import { sharetribeEnabled } from '@/lib/sharetribe'

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>
type Outcome = 'synced' | 'failed' | 'skipped'

const MAX_ATTEMPTS = 6

export interface EnqueueInput {
  eventType: string
  entityType: 'user' | 'listing' | 'transaction'
  entityId: string
  userId?: string | null
  payload?: Record<string, unknown>
  sourceUpdatedAt?: string
}

/**
 * Append a sync event to the outbox and kick the worker (best-effort) so it
 * syncs near-real-time. The cron is the durability backstop. Never throws.
 */
export async function enqueueSyncEvent(input: EnqueueInput): Promise<void> {
  const supabase = createServiceClient()
  if (!supabase) return
  const eventId = `evt_${input.entityType}_${randomBytes(8).toString('hex')}`
  try {
    await supabase.from('sharetribe_sync_outbox').insert({
      event_id: eventId,
      event_type: input.eventType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      user_id: input.userId ?? null,
      payload: input.payload ?? {},
      source_updated_at: input.sourceUpdatedAt ?? new Date().toISOString(),
      status: 'pending',
      next_attempt_at: new Date().toISOString(),
    })
  } catch {
    return
  }
  // Drain a few immediately; don't block the caller.
  void processOutbox({ limit: 5 }).catch(() => {})
}

interface OutboxRow {
  id: number
  event_type: string
  entity_type: string
  entity_id: string
  user_id: string | null
  payload: Record<string, unknown>
  status: string
  attempts: number
}

/** Process due outbox events. Safe to call from the cron and inline. */
export async function processOutbox(
  opts: { limit?: number } = {}
): Promise<{ processed: number; synced: number; failed: number }> {
  const supabase = createServiceClient()
  if (!supabase) return { processed: 0, synced: 0, failed: 0 }

  const { data } = await supabase
    .from('sharetribe_sync_outbox')
    .select('id, event_type, entity_type, entity_id, user_id, payload, status, attempts')
    .in('status', ['pending', 'failed'])
    .lte('next_attempt_at', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(opts.limit ?? 20)
  const events = (data ?? []) as OutboxRow[]

  let synced = 0
  let failed = 0
  for (const ev of events) {
    let outcome: Outcome = 'skipped'
    let errMsg: string | null = null
    try {
      if (ev.entity_type === 'user') outcome = await syncUser(supabase, ev)
      else outcome = 'skipped' // no handler yet (later phases)
    } catch (err) {
      outcome = 'failed'
      errMsg = err instanceof Error ? err.message : 'sync error'
    }

    if (outcome === 'synced') {
      synced += 1
      await supabase
        .from('sharetribe_sync_outbox')
        .update({ status: 'synced', synced_at: new Date().toISOString(), last_error: null })
        .eq('id', ev.id)
    } else if (outcome === 'skipped') {
      await supabase
        .from('sharetribe_sync_outbox')
        .update({ status: 'skipped', last_error: 'Sharetribe not configured or no handler yet' })
        .eq('id', ev.id)
    } else {
      failed += 1
      const attempts = ev.attempts + 1
      // Exponential backoff with a 60-minute cap: 2,4,8,16,32,60 min.
      const backoffMin = Math.min(60, 2 ** attempts)
      await supabase
        .from('sharetribe_sync_outbox')
        .update({
          status: 'failed',
          attempts,
          last_error: errMsg ?? 'sync failed',
          next_attempt_at: new Date(Date.now() + backoffMin * 60_000).toISOString(),
        })
        .eq('id', ev.id)
    }
  }

  return { processed: events.length, synced, failed }
}

/**
 * Sync a user to Sharetribe. Resolves (and stores) the Sharetribe id, creating
 * the marketplace user on first sight, then pushes profile fields.
 */
async function syncUser(supabase: ServiceClient, ev: OutboxRow): Promise<Outcome> {
  if (!sharetribeEnabled) return 'skipped'
  const userId = ev.entity_id
  const payload = (ev.payload ?? {}) as {
    email?: string
    displayName?: string | null
    userType?: string | null
  }

  let email = payload.email ?? null
  if (!email) {
    try {
      const { data } = await supabase.auth.admin.getUserById(userId)
      email = data.user?.email ?? null
    } catch {
      /* fall through */
    }
  }
  if (!email) return 'skipped'

  // Use the stored mapping if we have it; otherwise create/link and store it.
  const { data: link } = await supabase
    .from('sharetribe_links')
    .select('sharetribe_id')
    .eq('entity_type', 'user')
    .eq('entity_id', userId)
    .maybeSingle()
  let stId = (link as { sharetribe_id?: string } | null)?.sharetribe_id ?? null

  if (!stId) {
    const status = await createNilianceUser({
      userId,
      email,
      displayName: payload.displayName ?? null,
      userType: payload.userType ?? null,
    })
    if (status === 'unlinked') return 'skipped'
    if (status === 'error') return 'failed'
    stId = await resolveNilianceUserId(email)
    if (stId) {
      await supabase.from('sharetribe_links').upsert(
        {
          entity_type: 'user',
          entity_id: userId,
          sharetribe_id: stId,
          user_id: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'entity_type,entity_id' }
      )
    }
  }

  // Push the latest profile fields (syncProfile pulls them from the DB).
  const ok = await syncProfile({ userId })
  if (!ok) return 'failed'

  await logEvent({
    user_id: userId,
    level: 'info',
    direction: 'outbound',
    message: 'User synced to Sharetribe via outbox',
    metadata: { sharetribe_id: stId, event_type: ev.event_type },
  })
  return 'synced'
}
