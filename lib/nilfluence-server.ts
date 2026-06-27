import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlatformInput } from '@/lib/nilfluence'
import {
  resolveSocialInputs,
  type NilfPlatform,
  type PhylloStatRow,
  type SocialMetrics,
} from '@/lib/nilfluence-social'

/**
 * Fetch Phyllo stats + the talent's manual Profile→Social metrics and resolve
 * the four NILfluence platform inputs (Phyllo first, then manual, then 0).
 * Resilient: tolerates the phyllo table / social_metrics column not existing.
 * Server-only (touches Supabase) — keep out of client components.
 */
export async function getResolvedSocial(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<NilfPlatform, PlatformInput>> {
  let phylloRows: PhylloStatRow[] = []
  try {
    const { data } = await supabase
      .from('phyllo_social_stats')
      .select('platform, followers, avg_likes, avg_comments, avg_shares')
      .eq('user_id', userId)
    if (Array.isArray(data)) phylloRows = data as PhylloStatRow[]
  } catch {
    // phyllo table not present
  }

  let manual: SocialMetrics = {}
  try {
    const { data } = await supabase
      .from('profiles')
      .select('social_metrics')
      .eq('id', userId)
      .maybeSingle()
    const raw = (data as { social_metrics?: unknown } | null)?.social_metrics
    if (raw && typeof raw === 'object') manual = raw as SocialMetrics
  } catch {
    // social_metrics column not present yet
  }

  return resolveSocialInputs(phylloRows, manual)
}
