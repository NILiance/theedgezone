/**
 * High-level NILiance operations layered on Sharetribe.
 *
 * - createNilianceUser: called after Supabase signup. Creates a Sharetribe
 *   user (with a random password) and triggers a password-reset email
 *   so the user can claim their NILiance account with the same email.
 * - syncProfile: called after profile save. Pushes selected profile fields
 *   to the linked Sharetribe user.
 * - logEvent: records a sync event to niliance_sync_events for the admin
 *   dashboard.
 *
 * Every operation no-ops gracefully (with an event log entry) when
 * Sharetribe credentials are not configured.
 */
import { randomBytes } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import {
  getIntegrationSdk,
  getMarketplaceSdk,
  sharetribeEnabled,
} from '@/lib/sharetribe'

export type LinkStatus = 'unlinked' | 'pending' | 'linked' | 'error'

interface CreateNilianceUserParams {
  userId: string
  email: string
  displayName?: string | null
  userType?: string | null
}

interface SyncProfileParams {
  userId: string
  /** Optional explicit fields. If omitted, pulls latest profile from DB. */
  fields?: {
    bio?: string | null
    school?: string | null
    sport?: string | null
    athletic_position?: string | null
    socials?: Record<string, string> | null
    [key: string]: unknown
  }
}

export async function createNilianceUser(params: CreateNilianceUserParams): Promise<LinkStatus> {
  if (!sharetribeEnabled) {
    await logEvent({
      user_id: params.userId,
      level: 'warn',
      direction: 'outbound',
      message: 'Sharetribe not configured — skipping NILiance user create',
    })
    return 'unlinked'
  }

  const supabase = createServiceClient()
  if (!supabase) {
    await logEvent({
      user_id: params.userId,
      level: 'warn',
      direction: 'outbound',
      message: 'SUPABASE_SERVICE_ROLE_KEY missing — skipping NILiance user create',
    })
    return 'unlinked'
  }

  await supabase
    .from('profiles')
    .update({
      niliance_link_status: 'pending',
      niliance_last_attempt_at: new Date().toISOString(),
      niliance_link_error: null,
    })
    .eq('id', params.userId)

  try {
    const mpSdk = await getMarketplaceSdk()
    if (!mpSdk) throw new Error('Marketplace SDK unavailable')

    const randomPassword = randomBytes(24).toString('hex')
    const [firstName, ...rest] = (params.displayName ?? params.email.split('@')[0] ?? '').split(' ')
    const lastName = rest.join(' ') || firstName

    const created = await mpSdk.currentUser.create(
      {
        email: params.email,
        password: randomPassword,
        firstName: firstName || 'NIL',
        lastName: lastName || 'Talent',
        publicData: {
          ezOrigin: 'edgezone',
          ezUserId: params.userId,
          userType: params.userType ?? 'talent',
        },
      },
      { expand: true }
    )

    const stUserId = created?.data?.data?.id?.uuid ?? null

    // Trigger password reset so the user can claim their account
    try {
      await mpSdk.passwordReset.request({ email: params.email })
    } catch {
      // Non-fatal — link is still established
    }

    await supabase
      .from('profiles')
      .update({
        niliance_link_status: 'linked',
        niliance_user_id: stUserId,
        niliance_synced_at: new Date().toISOString(),
      })
      .eq('id', params.userId)

    await logEvent({
      user_id: params.userId,
      level: 'info',
      direction: 'outbound',
      message: `Created NILiance user ${stUserId}`,
      metadata: { sharetribe_user_id: stUserId },
    })
    return 'linked'
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status =
      (err as { status?: number })?.status ??
      (err as { data?: { errors?: Array<{ status?: number }> } })?.data?.errors?.[0]?.status
    // 409 Conflict = the email already has a NILiance account. That's not a
    // failure — the bridge goal (every Edge Zone user has a NILiance account)
    // is already met. Mark it linked-by-email instead of surfacing a red error.
    // (A failed create doesn't return the existing user's UUID, and the
    // Integration API can't look users up by email, so niliance_user_id stays
    // null; outbound profile sync simply no-ops until it's known.)
    const isDuplicate = status === 409 || /\b409\b/.test(message)
    if (isDuplicate) {
      // The email already has a NILiance account. Resolve its Sharetribe id by
      // email so the link is real (not just "by email"), then pull their data
      // into the Edge Zone profile.
      const stUserId = await resolveNilianceUserId(params.email)
      await supabase
        .from('profiles')
        .update({
          niliance_link_status: 'linked',
          niliance_user_id: stUserId,
          niliance_link_error: null,
          niliance_synced_at: new Date().toISOString(),
        })
        .eq('id', params.userId)
      await logEvent({
        user_id: params.userId,
        level: 'info',
        direction: 'outbound',
        message: stUserId
          ? 'NILiance account already exists — linked + id resolved by email.'
          : 'NILiance account already exists — linked by email (id unresolved).',
        metadata: stUserId ? { sharetribe_user_id: stUserId } : undefined,
      })
      if (stUserId) {
        try {
          await pullProfileFromNiliance({ userId: params.userId, stUserId })
        } catch {
          // Best-effort — the link is established regardless.
        }
      }
      return 'linked'
    }

    await supabase
      .from('profiles')
      .update({
        niliance_link_status: 'error',
        niliance_link_error: message,
      })
      .eq('id', params.userId)
    await logEvent({
      user_id: params.userId,
      level: 'error',
      direction: 'outbound',
      message: `Failed to create NILiance user: ${message}`,
    })
    return 'error'
  }
}

export async function syncProfile(params: SyncProfileParams): Promise<boolean> {
  if (!sharetribeEnabled) return false

  const supabase = createServiceClient()
  if (!supabase) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'niliance_user_id, niliance_link_status, bio, school, sport, athletic_position, socials'
    )
    .eq('id', params.userId)
    .maybeSingle()

  if (!profile?.niliance_user_id || profile.niliance_link_status !== 'linked') {
    return false
  }

  const fields = params.fields ?? {
    bio: (profile.bio as string | null) ?? null,
    school: (profile.school as string | null) ?? null,
    sport: (profile.sport as string | null) ?? null,
    athletic_position: (profile.athletic_position as string | null) ?? null,
    socials: (profile.socials as Record<string, string> | null) ?? null,
  }

  try {
    const integration = await getIntegrationSdk()
    if (!integration) throw new Error('Integration SDK unavailable')

    await integration.users.updateProfile({
      id: profile.niliance_user_id,
      publicData: {
        ...(fields.school != null ? { school: fields.school } : {}),
        ...(fields.sport != null ? { sport: fields.sport } : {}),
        ...(fields.athletic_position != null ? { position: fields.athletic_position } : {}),
        ...(fields.socials ? { socials: fields.socials } : {}),
        ezUserId: params.userId,
      },
      protectedData: {
        ...(fields.bio != null ? { bio: fields.bio } : {}),
      },
    })

    await supabase
      .from('profiles')
      .update({ niliance_synced_at: new Date().toISOString() })
      .eq('id', params.userId)

    await logEvent({
      user_id: params.userId,
      level: 'info',
      direction: 'outbound',
      message: 'Profile synced to NILiance',
      metadata: { fields: Object.keys(fields) },
    })
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await logEvent({
      user_id: params.userId,
      level: 'error',
      direction: 'outbound',
      message: `Profile sync failed: ${message}`,
    })
    return false
  }
}

// ── Inbound: pull profile data FROM NILiance ────────────────────────────────
// Mirrors the legacy bridge: resolve the Sharetribe user by email, read its
// publicData, and map the canonical pub_* fields onto the Edge Zone profile.

function parseHeightToInches(raw: unknown): number | null {
  if (typeof raw === 'number') return raw > 0 ? Math.round(raw) : null
  if (typeof raw !== 'string') return null
  // Forms like 6'5", 6' 5, 6-5
  const m = raw.match(/(\d+)\s*['’\-]\s*(\d+)?/)
  if (m) return parseInt(m[1]!, 10) * 12 + (m[2] ? parseInt(m[2], 10) : 0)
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 12 ? n : null
}

function uuidFrom(rec: unknown): string | null {
  const id = (rec as { id?: unknown } | null)?.id
  if (typeof id === 'string') return id
  return (id as { uuid?: string } | null)?.uuid ?? null
}

/** Look up a NILiance (Sharetribe) user id by email via the Integration API. */
export async function resolveNilianceUserId(email: string): Promise<string | null> {
  if (!sharetribeEnabled || !email) return null
  const sdk = await getIntegrationSdk().catch(() => null)
  if (!sdk) return null
  // Integration API users/show supports an `email` param (legacy used the same
  // endpoint). Fall back to users/query?email= if show rejects the param.
  try {
    const res = await sdk.users.show({ email })
    const id = uuidFrom(res?.data?.data)
    if (id) return id
  } catch {
    // fall through to query
  }
  try {
    const q = await sdk.users.query({ email })
    const first = Array.isArray(q?.data?.data) ? q.data.data[0] : null
    return uuidFrom(first)
  } catch {
    return null
  }
}

/**
 * Pull the linked NILiance profile into the Edge Zone profile. Resolves the
 * Sharetribe user id (from the stored link, then by email), reads its
 * publicData, and writes the fields Edge Zone supports. Only non-empty values
 * are written, and only known columns — so partial NILiance profiles are safe.
 */
export async function pullProfileFromNiliance(params: {
  userId: string
  stUserId?: string | null
}): Promise<{ ok: boolean; fields?: number; error?: string }> {
  if (!sharetribeEnabled) return { ok: false, error: 'NILiance is not configured.' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, error: 'Service role key missing.' }

  // Resolve the Sharetribe user id: passed in → stored on profile → by email.
  let stUserId = params.stUserId ?? null
  if (!stUserId) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('niliance_user_id')
      .eq('id', params.userId)
      .maybeSingle()
    stUserId = (prof?.niliance_user_id as string | null) ?? null
  }
  if (!stUserId) {
    const { data: userRes } = await supabase.auth.admin.getUserById(params.userId)
    const email = userRes?.user?.email
    if (email) stUserId = await resolveNilianceUserId(email)
  }
  if (!stUserId) return { ok: false, error: 'Could not find a matching NILiance account.' }

  try {
    const sdk = await getIntegrationSdk()
    if (!sdk) return { ok: false, error: 'Integration SDK unavailable.' }
    const res = await sdk.users.show({ id: stUserId })
    const profileObj = (res?.data?.data?.attributes?.profile ?? {}) as {
      bio?: unknown
      publicData?: Record<string, unknown>
    }
    const pub = (profileObj.publicData ?? {}) as Record<string, unknown>

    const str = (v: unknown): string | null =>
      typeof v === 'string' && v.trim() ? v.trim() : null
    const firstOf = (v: unknown): string | null =>
      Array.isArray(v) && v.length ? str(v[0]) : str(v)

    const update: Record<string, unknown> = {}
    const setIf = (k: string, v: unknown) => {
      if (v != null && v !== '') update[k] = v
    }

    setIf('bio', str(profileObj.bio))
    setIf('sport', firstOf(pub.pub_sports) ?? str(pub.sport))
    setIf('school', str(pub.schoolDisplayName) ?? str(pub.school) ?? str(pub.university))
    setIf('conference', str(pub.conference))
    setIf('jersey_number', str(pub.pub_jersey_number))
    setIf('hometown', str(pub.pub_hometown))
    setIf('city', str(pub.pub_current_town) ?? str(pub.pub_hometown_city))
    setIf('us_state', str(pub.pub_state) ?? str(pub.pub_hometown_state))
    const h = parseHeightToInches(pub.pub_height)
    if (h) update.height_inches = h
    const wRaw = typeof pub.pub_weight === 'number' ? pub.pub_weight : parseInt(str(pub.pub_weight) ?? '', 10)
    if (Number.isFinite(wRaw) && wRaw > 0) update.weight_lbs = wRaw
    // Position lives under a sport-specific key (e.g. position-mens-basketball).
    const posKey = Object.keys(pub).find((k) => k.toLowerCase().startsWith('position'))
    if (posKey) setIf('athletic_position', firstOf(pub[posKey]))

    const fieldCount = Object.keys(update).length
    if (fieldCount === 0) {
      await supabase
        .from('profiles')
        .update({ niliance_synced_at: new Date().toISOString() })
        .eq('id', params.userId)
      return { ok: true, fields: 0 }
    }

    update.niliance_synced_at = new Date().toISOString()
    const { error } = await supabase.from('profiles').update(update).eq('id', params.userId)
    if (error) return { ok: false, error: error.message }

    await logEvent({
      user_id: params.userId,
      level: 'info',
      direction: 'inbound',
      message: `Pulled ${fieldCount} field(s) from NILiance`,
      metadata: { fields: Object.keys(update).filter((k) => k !== 'niliance_synced_at') },
    })
    return { ok: true, fields: fieldCount }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'NILiance pull failed.' }
  }
}

interface LogEventParams {
  user_id?: string | null
  level: 'info' | 'warn' | 'error'
  direction: 'outbound' | 'inbound'
  message: string
  metadata?: Record<string, unknown>
}

export async function logEvent(params: LogEventParams) {
  try {
    const supabase = createServiceClient()
    if (!supabase) return
    await supabase.from('niliance_sync_events').insert({
      user_id: params.user_id ?? null,
      level: params.level,
      direction: params.direction,
      message: params.message,
      metadata: params.metadata ?? null,
    })
  } catch {
    // Best-effort — never block on logging.
  }
}
