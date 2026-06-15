/**
 * NILfluence Score + Brand Match Score calculator.
 *
 * Mirrors the formulas in the original NILfluence spreadsheet:
 *
 * - Per platform we compute Engagement Rate = (likes + comments + shares) /
 *   followers
 * - Total Engagement Rate = sum of likes+comments+shares across all
 *   platforms / sum of followers
 * - Industry-average post value used as monetization anchor: $10 per 1K
 *   followers at 1% engagement (configurable).
 *
 * Brand Match Score (BMS) = I + D + O on a 0..2 scale each, then scaled to
 * 0..100. Buckets map to encouraging tier labels.
 */

export interface PlatformInput {
  followers: number
  likes_per_post: number
  comments_per_post: number
  shares_per_post: number
}

export interface NilfluenceInput {
  instagram: PlatformInput
  tiktok: PlatformInput
  twitter: PlatformInput
  youtube: PlatformInput
  /** 0..100: awards, search trends, media presence */
  athlete_popularity: number
  /** 0..100: team strength, conference, fanbase */
  team_popularity: number
  /** 0..100: location-based NIL potential */
  market_size: number
  /** -48..+48 nudge for NIL-friendliness, brand fit, etc. */
  adjustment_factor: number
  /** Optional: revenue inputs to compute breakeven / ROI */
  profit_per_product?: number
  /** % of total engagements that convert to purchases (e.g., 0.005 = 0.5%) */
  purchase_conversion_rate?: number
}

export interface PlatformBreakdown {
  followers: number
  total_engagement: number
  engagement_rate: number
}

export interface NilfluenceResult {
  per_platform: {
    instagram: PlatformBreakdown
    tiktok: PlatformBreakdown
    twitter: PlatformBreakdown
    youtube: PlatformBreakdown
  }
  total_followers: number
  total_likes_per_post: number
  total_comments_per_post: number
  total_shares_per_post: number
  total_engagements_per_post: number
  total_engagement_rate: number
  approximate_post_value: number
  nilfluence_score: number
  monetization?: {
    profit_per_product: number
    products_to_breakeven: number
    estimated_products_sold: number
    revenue: number
    roi: number
  }
}

const POST_VALUE_PER_1K_AT_1_PCT = 10

function platformBreakdown(p: PlatformInput): PlatformBreakdown {
  const totalEng = (p.likes_per_post ?? 0) + (p.comments_per_post ?? 0) + (p.shares_per_post ?? 0)
  const er = p.followers > 0 ? totalEng / p.followers : 0
  return {
    followers: p.followers,
    total_engagement: totalEng,
    engagement_rate: er,
  }
}

export function computeNilfluence(input: NilfluenceInput): NilfluenceResult {
  const ig = platformBreakdown(input.instagram)
  const tt = platformBreakdown(input.tiktok)
  const tw = platformBreakdown(input.twitter)
  const yt = platformBreakdown(input.youtube)

  const totalFollowers = ig.followers + tt.followers + tw.followers + yt.followers
  const totalLikes =
    input.instagram.likes_per_post +
    input.tiktok.likes_per_post +
    input.twitter.likes_per_post +
    input.youtube.likes_per_post
  const totalComments =
    input.instagram.comments_per_post +
    input.tiktok.comments_per_post +
    input.twitter.comments_per_post +
    input.youtube.comments_per_post
  const totalShares =
    input.instagram.shares_per_post +
    input.tiktok.shares_per_post +
    input.twitter.shares_per_post +
    input.youtube.shares_per_post
  const totalEng = totalLikes + totalComments + totalShares
  const overallER = totalFollowers > 0 ? totalEng / totalFollowers : 0

  // Industry-average pricing anchor: $10 per 1K followers at 1% ER,
  // scaled linearly to the actual ER.
  const approximatePostValue =
    totalFollowers > 0 ? (totalFollowers / 1000) * (overallER * POST_VALUE_PER_1K_AT_1_PCT * 100) : 0

  // NILfluence Score: composite of reach (total followers, log-scaled to
  // soften 5M-follower outliers), engagement quality, and the three
  // popularity dimensions, plus the adjustment factor.
  const reachScore = totalFollowers > 0 ? Math.min(100, (Math.log10(totalFollowers + 1) / Math.log10(10_000_000)) * 100) : 0
  const engagementScore = Math.min(100, overallER * 100 * 20) // ER of 5% = 100
  const popularityAvg =
    (clamp(input.athlete_popularity, 0, 100) +
      clamp(input.team_popularity, 0, 100) +
      clamp(input.market_size, 0, 100)) /
    3
  const baseScore = reachScore * 0.25 + engagementScore * 0.25 + popularityAvg * 0.5
  const nilfluenceScore = clamp(baseScore + (input.adjustment_factor ?? 0), 0, 100)

  let monetization: NilfluenceResult['monetization'] = undefined
  if (input.profit_per_product && input.profit_per_product > 0) {
    const conversion = input.purchase_conversion_rate ?? 0.005 // default 0.5%
    const productsToBreakeven = approximatePostValue / input.profit_per_product
    const estimatedProductsSold = totalEng * conversion
    const revenue = estimatedProductsSold * input.profit_per_product
    const roi = revenue > 0 ? (revenue - approximatePostValue) / approximatePostValue : 0
    monetization = {
      profit_per_product: input.profit_per_product,
      products_to_breakeven: productsToBreakeven,
      estimated_products_sold: estimatedProductsSold,
      revenue,
      roi,
    }
  }

  return {
    per_platform: { instagram: ig, tiktok: tt, twitter: tw, youtube: yt },
    total_followers: totalFollowers,
    total_likes_per_post: totalLikes,
    total_comments_per_post: totalComments,
    total_shares_per_post: totalShares,
    total_engagements_per_post: totalEng,
    total_engagement_rate: overallER,
    approximate_post_value: approximatePostValue,
    nilfluence_score: nilfluenceScore,
    monetization,
  }
}

// ── Brand Match Score ─────────────────────────────────────────────────────

export interface BrandMatchInput {
  /** Industry Fit (0..2) */
  i: number
  /** Demographic Match (0..2) */
  d: number
  /** Objective Match (0..2) */
  o: number
}

export interface BrandMatchResult {
  raw_score: number // 0..6
  bms_100: number // scaled 0..100
  tier: { label: string; emoji: string; interpretation: string }
}

export function computeBMS(input: BrandMatchInput): BrandMatchResult {
  const raw = clamp(input.i, 0, 2) + clamp(input.d, 0, 2) + clamp(input.o, 0, 2)
  const bms = (raw / 6) * 100
  let tier: BrandMatchResult['tier']
  if (bms >= 90) {
    tier = {
      label: 'Perfect Match',
      emoji: '✅',
      interpretation: 'Highly aligned across industry, demographics, and objectives.',
    }
  } else if (bms >= 75) {
    tier = {
      label: 'Great Fit',
      emoji: '⭐',
      interpretation: 'Strong match — minor messaging or audience tweaks would optimize.',
    }
  } else if (bms >= 60) {
    tier = {
      label: 'Good Fit',
      emoji: '👍',
      interpretation: 'Solid alignment; some strategy changes would tighten it.',
    }
  } else if (bms >= 45) {
    tier = {
      label: 'Moderate Fit',
      emoji: '⚖️',
      interpretation: 'Overlap exists, but key areas need adjustment.',
    }
  } else if (bms >= 30) {
    tier = {
      label: 'Worth Exploring',
      emoji: '🔍',
      interpretation: 'Could work with significant messaging or audience tuning.',
    }
  } else if (bms > 0) {
    tier = {
      label: 'Early Stage',
      emoji: '🌱',
      interpretation: 'Not a natural pairing today — keep evolving your offerings.',
    }
  } else {
    tier = {
      label: 'No Connection',
      emoji: '🚫',
      interpretation: 'No alignment exists between athlete and brand.',
    }
  }
  return { raw_score: raw, bms_100: bms, tier }
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo
  return Math.max(lo, Math.min(hi, v))
}
