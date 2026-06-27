import type { PlatformInput } from '@/lib/nilfluence'

/** The four platforms the NILfluence score reads. */
export const NILF_PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube'] as const
export type NilfPlatform = (typeof NILF_PLATFORMS)[number]

export interface PhylloStatRow {
  platform: string
  followers?: number | null
  avg_likes?: number | null
  avg_comments?: number | null
  avg_shares?: number | null
}

/** Manual per-platform metrics entered in Profile → Social. `er` is a PERCENT. */
export type SocialMetrics = Record<string, { followers?: number; er?: number } | undefined>

const empty = (): PlatformInput => ({
  followers: 0,
  likes_per_post: 0,
  comments_per_post: 0,
  shares_per_post: 0,
})

/**
 * Resolve the four platform inputs for the NILfluence score, preferring live
 * Phyllo stats and falling back to the talent's manually-entered followers +
 * engagement rate. A manual ER (a percent) is folded into "likes" so the
 * formula's (likes+comments+shares)/followers reproduces that exact ER.
 */
export function resolveSocialInputs(
  phyllo: PhylloStatRow[],
  manual: SocialMetrics
): Record<NilfPlatform, PlatformInput> {
  const pick = (platform: NilfPlatform): PlatformInput => {
    // 1) Phyllo first (when it actually has a follower count).
    const ph = phyllo.find((r) => r.platform === platform)
    if (ph && (ph.followers ?? 0) > 0) {
      return {
        followers: ph.followers ?? 0,
        likes_per_post: ph.avg_likes ?? 0,
        comments_per_post: ph.avg_comments ?? 0,
        shares_per_post: ph.avg_shares ?? 0,
      }
    }
    // 2) Manual fallback (followers + engagement-rate %).
    const mm = manual[platform]
    if (mm && (mm.followers ?? 0) > 0) {
      const followers = mm.followers ?? 0
      const er = mm.er ?? 0 // percent
      return {
        followers,
        likes_per_post: (er / 100) * followers,
        comments_per_post: 0,
        shares_per_post: 0,
      }
    }
    return empty()
  }
  return {
    instagram: pick('instagram'),
    tiktok: pick('tiktok'),
    twitter: pick('twitter'),
    youtube: pick('youtube'),
  }
}
