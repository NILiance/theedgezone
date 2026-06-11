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
  const supabase = createServiceClient()

  if (!sharetribeEnabled) {
    await logEvent({
      user_id: params.userId,
      level: 'warn',
      direction: 'outbound',
      message: 'Sharetribe not configured — skipping NILiance user create',
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
