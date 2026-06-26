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

// ── Inbound value normalizers (mirror legacy ez_niliance_apply_inbound) ──────

const US_STATE_ABBR: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
}

const DIVISION_NORM: Record<string, string> = {
  division1fbs: 'NCAA D1 FBS', d1fbs: 'NCAA D1 FBS',
  division1fcs: 'NCAA D1 FCS', d1fcs: 'NCAA D1 FCS',
  division2: 'NCAA D2', d2: 'NCAA D2',
  division3: 'NCAA D3', d3: 'NCAA D3',
  naia: 'NAIA', njcaa: 'NJCAA',
}

const SPORT_NORM: Record<string, string> = {
  'track-and-field': 'Track & Field', 'track-field': 'Track & Field',
  'cross-country': 'Cross Country', 'water-polo': 'Water Polo',
  'field-hockey': 'Field Hockey', 'cheer-dance': 'Cheer/Dance', cheer: 'Cheer/Dance',
  'boxing-mma': 'Boxing/MMA', mma: 'Boxing/MMA', boxing: 'Boxing/MMA',
}

function normalizeState(v: string): string {
  return US_STATE_ABBR[v.toLowerCase()] ?? v
}

function normalizeDivision(v: string): string {
  const key = v.toLowerCase().replace(/[^a-z0-9]/g, '')
  return DIVISION_NORM[key] ?? v
}

/** "mens-basketball" → "Basketball"; "track-and-field" → "Track & Field". */
function humanizeSport(v: string): string {
  const slug = v.toLowerCase().replace(/^(mens|womens|coed)-/, '')
  if (SPORT_NORM[v.toLowerCase()] || SPORT_NORM[slug]) return SPORT_NORM[v.toLowerCase()] ?? SPORT_NORM[slug]!
  return slug
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim()
}

/** MM/DD/YYYY or ISO → YYYY-MM-DD (Postgres date). */
function normalizeDob(v: string): string | null {
  const mdy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1]!.padStart(2, '0')}-${mdy[2]!.padStart(2, '0')}`
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  return null
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
}): Promise<{ ok: boolean; fields?: number; error?: string; availableKeys?: string[] }> {
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

  // Persist the resolved id so the link is real (fixes the "—" UUID) and
  // future syncs skip the email lookup.
  if (stUserId !== params.stUserId) {
    await supabase.from('profiles').update({ niliance_user_id: stUserId }).eq('id', params.userId)
  }

  try {
    const sdk = await getIntegrationSdk()
    if (!sdk) return { ok: false, error: 'Integration SDK unavailable.' }

    // Read the USER (with profile image). Handle both response shapes.
    const userRes = await sdk.users.show({
      id: stUserId,
      include: ['profileImage'],
      'fields.image': 'variants.square-small2x,variants.default,variants.square-small',
    })
    const userBody = userRes?.data ?? {}
    const userAttrs = (userBody?.data?.attributes ?? userBody?.attributes ?? {}) as {
      profile?: {
        bio?: unknown
        displayName?: unknown
        publicData?: Record<string, unknown>
        protectedData?: Record<string, unknown>
      }
    }
    const userProfile = userAttrs.profile ?? {}
    const userPub = (userProfile.publicData ?? {}) as Record<string, unknown>
    const userProt = (userProfile.protectedData ?? {}) as Record<string, unknown>

    // Athlete fields (pub_*) live on the talent's LISTING, not the user.
    let listingPub: Record<string, unknown> = {}
    let listingDescription: string | null = null
    try {
      const lq = await sdk.listings.query({ authorId: stUserId })
      const listings = Array.isArray(lq?.data?.data) ? lq.data.data : []
      const first = listings[0]
      const lAttrs = (first?.attributes ?? {}) as {
        description?: unknown
        publicData?: Record<string, unknown>
      }
      listingPub = (lAttrs.publicData ?? {}) as Record<string, unknown>
      listingDescription = typeof lAttrs.description === 'string' ? lAttrs.description : null
    } catch {
      // Listing fetch is best-effort.
    }

    // Listing wins for athletic fields; user publicData/protectedData fills the rest.
    const merged: Record<string, unknown> = { ...userProt, ...userPub, ...listingPub }
    const availableKeys = Object.keys(merged)

    const str = (v: unknown): string | null =>
      typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null
    const firstOf = (v: unknown): string | null =>
      Array.isArray(v) && v.length ? str(v[0]) : str(v)
    // Key-variant resolver (mirrors legacy lookup_value): for each candidate
    // also try pub_X↔X and snake↔camel forms — NILiance is inconsistent.
    const variantsOf = (key: string): string[] => {
      const out = [key]
      if (key.startsWith('pub_')) out.push(key.slice(4))
      else out.push('pub_' + key)
      if (key.includes('_')) out.push(key.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase()))
      else if (/[A-Z]/.test(key)) out.push(key.replace(/([A-Z])/g, '_$1').toLowerCase())
      return out
    }
    const pick = (keys: string[]): unknown => {
      for (const key of keys) {
        for (const vk of variantsOf(key)) {
          const v = merged[vk]
          if (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) return v
        }
      }
      return null
    }

    const update: Record<string, unknown> = {}
    const setIf = (col: string, v: unknown) => {
      if (v != null && v !== '') update[col] = v
    }

    setIf('bio', str(userProfile.bio) ?? str(pick(['bio'])) ?? listingDescription)

    const sportRaw = firstOf(pick(['pub_sports', 'sports', 'sport']))
    if (sportRaw) setIf('sport', humanizeSport(sportRaw))

    // Position: per-sport key like position-mens-basketball, else bare position.
    const posEntryKey = availableKeys.find(
      (k) => k.toLowerCase().startsWith('position-') && str(merged[k])
    )
    setIf(
      'athletic_position',
      posEntryKey ? firstOf(merged[posEntryKey]) : firstOf(pick(['position', 'athletic_position']))
    )

    // School: NILiance splits school (canonical "Rutgers") + schoolDisplayName
    // (mascot "Scarlet Knights"). Combine like the legacy does.
    const schoolMain = str(pick(['school']))
    const schoolSuffix = str(merged['schoolDisplayName'])
    const schoolCombined =
      [schoolMain, schoolSuffix].filter(Boolean).join(' ') ||
      str(pick(['university', 'pub_school_or_group_name', 'collegeName']))
    setIf('school', schoolCombined)

    setIf('conference', str(pick(['conference'])))
    const divRaw = str(pick(['division']))
    if (divRaw) setIf('division', normalizeDivision(divRaw))
    setIf('jersey_number', str(pick(['pub_jersey_number', 'jersey_number'])))
    setIf('hometown', firstOf(pick(['pub_hometown', 'hometown'])))
    setIf('city', str(pick(['pub_current_town', 'city', 'current_town', 'pub_hometown_city'])))
    const stateRaw = str(pick(['pub_state', 'state', 'pub_hometown_state']))
    if (stateRaw) setIf('us_state', normalizeState(stateRaw))

    // Height: separate feet/inches fields, else a combined string.
    const feet = parseInt(str(pick(['height_feet', 'pub_height_feet'])) ?? '', 10)
    const inches = parseInt(str(pick(['height_inches', 'pub_height_inches'])) ?? '', 10)
    let totalIn: number | null = null
    if (Number.isFinite(feet) && feet > 0) {
      totalIn = feet * 12 + (Number.isFinite(inches) ? inches : 0)
    } else {
      totalIn = parseHeightToInches(pick(['pub_height', 'height', 'heightString']))
    }
    if (totalIn && totalIn > 12) update.height_inches = totalIn

    const wPick = pick(['pub_weight', 'weight'])
    const wRaw = typeof wPick === 'number' ? wPick : parseInt(str(wPick) ?? '', 10)
    if (Number.isFinite(wRaw) && wRaw > 0) update.weight_lbs = wRaw

    const dobRaw = str(pick(['dateOfBirth', 'date_of_birth', 'dob']))
    if (dobRaw) setIf('date_of_birth', normalizeDob(dobRaw))

    setIf('phone', str(pick(['phone', 'phoneNumber', 'contactPhone', 'mobilePhone'])))
    setIf('agency_name', str(pick(['agencyName', 'agency_name', 'agency'])))

    // Socials: a { instagram, tiktok, … } object and/or per-platform handle keys.
    const socials: Record<string, string> = {}
    const socObj = pick(['socials'])
    if (socObj && typeof socObj === 'object' && !Array.isArray(socObj)) {
      for (const [k, v] of Object.entries(socObj as Record<string, unknown>)) {
        const s = str(v)
        if (s) socials[k.toLowerCase()] = s
      }
    }
    for (const plat of ['instagram', 'tiktok', 'twitter', 'youtube', 'facebook', 'snapchat']) {
      if (socials[plat]) continue
      const handle = str(pick([`${plat}_handle`, `${plat}Handle`, `${plat}_username`, plat]))
      if (handle) socials[plat] = handle
    }
    const xHandle = str(pick(['x_handle', 'xHandle', 'twitterX_handle']))
    if (xHandle && !socials.twitter) socials.twitter = xHandle
    if (Object.keys(socials).length) update.socials = socials

    // Profile image — Sharetribe returns the imgix URL on the included image.
    const included = Array.isArray(userBody?.included) ? (userBody.included as unknown[]) : []
    const imageRes = included.find(
      (r) => (r as { type?: string } | null)?.type === 'image'
    ) as { attributes?: { variants?: Record<string, { url?: string }> } } | undefined
    const variants = imageRes?.attributes?.variants ?? {}
    const avatarUrl =
      variants['default']?.url ??
      variants['square-small2x']?.url ??
      variants['square-small']?.url ??
      Object.values(variants).find((v) => v?.url)?.url ??
      null
    setIf('avatar_url', avatarUrl)

    // Affiliations (past teams, charities, sponsors). Written in a SEPARATE
    // best-effort update so a missing column (migration not yet applied)
    // can't fail the main field sync.
    const affRaw = pick(['affiliations'])
    if (Array.isArray(affRaw) && affRaw.length) {
      const affs = affRaw
        .map((a) => {
          if (typeof a === 'string') return { organization: a, role: '' }
          if (a && typeof a === 'object') {
            const o = a as Record<string, unknown>
            return {
              organization: str(o.organization ?? o.name ?? o.org ?? o.title) ?? '',
              role: str(o.role ?? o.position ?? o.type) ?? '',
            }
          }
          return null
        })
        .filter((a): a is { organization: string; role: string } => Boolean(a && a.organization))
      if (affs.length) {
        const { error: affErr } = await supabase
          .from('profiles')
          .update({ affiliations: affs })
          .eq('id', params.userId)
        if (affErr) {
          // Most likely the migration isn't applied yet — non-fatal.
        }
      }
    }

    const fieldKeys = Object.keys(update)
    const fieldCount = fieldKeys.length

    if (fieldCount === 0) {
      await supabase
        .from('profiles')
        .update({ niliance_synced_at: new Date().toISOString() })
        .eq('id', params.userId)
      // Log the keys we DID receive so the mapping can be extended exactly.
      await logEvent({
        user_id: params.userId,
        level: 'warn',
        direction: 'inbound',
        message: availableKeys.length
          ? `NILiance returned ${availableKeys.length} field(s) but none mapped. Keys: ${availableKeys.slice(0, 40).join(', ')}`
          : 'NILiance returned no publicData on the user or their listing.',
        metadata: { availableKeys },
      })
      return { ok: true, fields: 0, availableKeys }
    }

    update.niliance_synced_at = new Date().toISOString()
    const { error } = await supabase.from('profiles').update(update).eq('id', params.userId)
    if (error) return { ok: false, error: error.message }

    await logEvent({
      user_id: params.userId,
      level: 'info',
      direction: 'inbound',
      message: `Pulled ${fieldCount} field(s) from NILiance: ${fieldKeys.join(', ')}`,
      metadata: { fields: fieldKeys, availableKeys },
    })
    return { ok: true, fields: fieldCount, availableKeys }
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
