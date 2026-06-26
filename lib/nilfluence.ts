/**
 * NILfluence Score + Brand Match Score — an EXACT port of the official
 * "_NILfluence Calculator" spreadsheet (sheets "NILfluence Score" and
 * "Brand Match Score"). Do not "improve" the weights/constants — they're
 * copied verbatim from the workbook so the app matches it to the decimal.
 *
 * NILfluence Score (sheet cell B22):
 *   reach       = LOG10(totalFollowers + 1) * 10 * 0.55
 *   engagement  = Σ per-platform [ (likes+comments+shares)/followers * 100 * 0.22 ]
 *                 over Instagram, TikTok, Twitter, YouTube
 *   popularity  = athlete*0.18 + team*0.12 + market*0.08   (each 0..100)
 *   adjustment  = (adjustmentFactor / 50) * 100 * 0.14     (adjustmentFactor 0..48)
 *   score       = reach + engagement + popularity + adjustment  (NOT clamped;
 *                 a "perfect" athlete lands ~100)
 *
 * Brand Match Score (sheet cell D2/E2):
 *   bms  = (I + D + O) / 6 * 100   (I, D, O each 0..2)
 *   tier per the workbook's nested IF (Perfect/Great/Good/Moderate/Weak/Poor/No).
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
  /** 0..48: NIL-friendliness / brand fit bonus (spreadsheet uses a 0–48 scale) */
  adjustment_factor: number
  /** Optional: revenue inputs to compute breakeven / ROI */
  profit_per_product?: number
  /** % of total engagements that convert to purchases (spreadsheet default 0.05 = 5%) */
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

function platformBreakdown(p: PlatformInput): PlatformBreakdown {
  const totalEng = (p.likes_per_post ?? 0) + (p.comments_per_post ?? 0) + (p.shares_per_post ?? 0)
  // ER = engagements / followers. Spreadsheet would #DIV/0! at 0 followers; we
  // guard to 0 so an unused platform simply contributes nothing.
  const er = p.followers > 0 ? totalEng / p.followers : 0
  return { followers: p.followers, total_engagement: totalEng, engagement_rate: er }
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

  // ── NILfluence Score — verbatim from sheet cell B22 ───────────────────────
  const reach = Math.log10(totalFollowers + 1) * 10 * 0.55
  const engagement =
    ig.engagement_rate * 100 * 0.22 +
    tt.engagement_rate * 100 * 0.22 +
    tw.engagement_rate * 100 * 0.22 +
    yt.engagement_rate * 100 * 0.22
  const popularity =
    clamp(input.athlete_popularity, 0, 100) * 0.18 +
    clamp(input.team_popularity, 0, 100) * 0.12 +
    clamp(input.market_size, 0, 100) * 0.08
  const adjustment = (clamp(input.adjustment_factor, 0, 48) / 50) * 100 * 0.14
  const nilfluenceScore = reach + engagement + popularity + adjustment

  // Approximate post value (sheet B30): totalFollowers × total engagement rate.
  const approximatePostValue = totalFollowers * overallER

  let monetization: NilfluenceResult['monetization'] = undefined
  if (input.profit_per_product && input.profit_per_product > 0) {
    const conversion = input.purchase_conversion_rate ?? 0.05 // sheet B34 default 5%
    const productsToBreakeven = approximatePostValue / input.profit_per_product // B33
    const estimatedProductsSold = totalEng * conversion // B35
    const revenue = estimatedProductsSold * input.profit_per_product // B36
    // ROI as a margin: (revenue − post value) / revenue  (sheet C37).
    const roi = revenue > 0 ? (revenue - approximatePostValue) / revenue : 0
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
  // Tiers + interpretations are verbatim from the workbook's "Brand Match
  // Score" sheet (the nested-IF in E2 and the ranges table B41:C47).
  let tier: BrandMatchResult['tier']
  if (bms >= 90) {
    tier = {
      label: 'Perfect Match',
      emoji: '✅',
      interpretation:
        'The brand and athlete are highly aligned across industry, demographics, and objectives. This partnership is a strong NIL opportunity.',
    }
  } else if (bms >= 75) {
    tier = {
      label: 'Great Fit',
      emoji: '⭐',
      interpretation:
        'There is a strong match between the brand and athlete, but minor adjustments (e.g., messaging or audience focus) could further optimize the partnership.',
    }
  } else if (bms >= 60) {
    tier = {
      label: 'Good Fit',
      emoji: '👍',
      interpretation:
        'The brand and athlete have solid alignment, but some strategy changes (e.g., campaign type, creative direction) are needed to make the deal truly effective.',
    }
  } else if (bms >= 45) {
    tier = {
      label: 'Moderate Fit',
      emoji: '⚖️',
      interpretation:
        'There is some overlap, but key areas (industry, audience, or objectives) don’t fully match. This partnership could work, but it requires significant modifications.',
    }
  } else if (bms >= 30) {
    tier = {
      label: 'Weak Fit',
      emoji: '⚠️',
      interpretation:
        'The partnership lacks strong alignment. If pursued, major messaging or audience adjustments are required for the deal to work.',
    }
  } else if (bms >= 1) {
    tier = {
      label: 'Poor Fit',
      emoji: '❌',
      interpretation:
        'The brand and athlete have little to no compatibility. A partnership would feel forced and would likely underperform.',
    }
  } else {
    tier = {
      label: 'No Match',
      emoji: '🚫',
      interpretation: 'No connection exists between the athlete and the brand. The NIL opportunity is not viable.',
    }
  }
  return { raw_score: raw, bms_100: bms, tier }
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo
  return Math.max(lo, Math.min(hi, v))
}
