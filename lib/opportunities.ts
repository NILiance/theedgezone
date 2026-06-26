/**
 * NILiance / Sharetribe opportunity helpers.
 *
 * Opportunities = Sharetribe Marketplace listings. We mirror them in
 * public.opportunities so browsing doesn't hit Sharetribe live. The cron
 * at /api/cron/niliance-poll keeps the mirror fresh.
 */
import { getIntegrationSdk, getMarketplaceSdk, sharetribeEnabled } from '@/lib/sharetribe'
import { nilianceListingUrl, slugify } from '@/lib/niliance-urls'
import { OFFERING_LABELS } from '@/lib/opportunity-categories'

export { OFFERING_LABELS, OFFERING_FILTERS } from '@/lib/opportunity-categories'

export interface CreateOpportunityInput {
  title: string
  description: string
  category?: string
  price_cents?: number
  currency?: string
  authorUuid?: string // Sharetribe author; null → admin posts on platform behalf
}

interface SharetribeResp {
  ok: boolean
  listingUuid?: string
  error?: string
}

export async function createSharetribeOpportunity(
  input: CreateOpportunityInput
): Promise<SharetribeResp> {
  if (!sharetribeEnabled) return { ok: false, error: 'Sharetribe not configured' }

  const sdk = await getIntegrationSdk()
  if (!sdk) return { ok: false, error: 'Integration SDK unavailable' }

  try {
    const params: Record<string, unknown> = {
      title: input.title,
      description: input.description,
      state: 'published',
      publicData: {
        category: input.category ?? null,
        ezOrigin: 'edgezone',
      },
    }
    if (input.price_cents && input.price_cents > 0) {
      params.price = { amount: input.price_cents, currency: input.currency ?? 'USD' }
    }
    if (input.authorUuid) {
      params.authorId = input.authorUuid
    }
    const resp = await sdk.listings.create(params)
    const listingUuid = resp?.data?.data?.id?.uuid ?? resp?.data?.data?.id
    return { ok: true, listingUuid }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sharetribe error'
    return { ok: false, error: msg }
  }
}

export async function closeSharetribeOpportunity(listingUuid: string): Promise<SharetribeResp> {
  if (!sharetribeEnabled) return { ok: false, error: 'Sharetribe not configured' }
  const sdk = await getIntegrationSdk()
  if (!sdk) return { ok: false, error: 'Integration SDK unavailable' }
  try {
    await sdk.listings.close({ id: listingUuid })
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sharetribe error'
    return { ok: false, error: msg }
  }
}

export interface SharetribeListing {
  uuid: string
  title: string
  description: string
  state: string
  price?: { amount: number; currency: string } | null
  publicData?: Record<string, unknown>
  authorUuid?: string | null
  updatedAt?: string
}

// ── Brand opportunities (live, filtered) — faithful port of the legacy
//    ez_niliance_ajax_opportunities_browse filtering. Opportunities = NILiance
//    brand-authored offerings (NOT profile listings, NOT talent/consumer posts).

const PROFILE_CATEGORIES = new Set([
  'talent', 'brand', 'agency', 'team', 'collective', 'organization',
  'school', 'conference', 'individual', 'profile',
  'fan', 'fans', 'supporter', 'supporters', 'subscriber', 'subscribers',
  'member', 'members', 'consumer', 'consumers', 'user', 'users',
  'coach', 'coaches', 'parent', 'parents', 'athlete', 'athletes',
  'creator', 'creators', 'influencer', 'influencers',
])

const OFFERING_MAP: Record<string, string[]> = {
  campaign: ['campaign', 'campaigns', 'brand-campaign', 'brandCampaign', 'sponsorship', 'sponsor', 'sponsored', 'partnership', 'partner', 'collab', 'collaboration', 'brandDeal', 'brand-deal', 'branddeal', 'endorsement', 'endorsements', 'ambassador', 'ambassadorship'],
  single_job: ['single_job', 'single-job', 'singleJob', 'singlejob', 'single', 'single_post', 'job', 'jobs', 'gig', 'gigs', 'task', 'tasks', 'service', 'services', 'appearance', 'appearances', 'shoutout', 'shoutouts', 'autograph', 'autographs', 'content', 'post', 'social', 'social_post', 'social-post', 'video', 'photo', 'voiceover', 'message', 'cameo'],
  bulk_job: ['bulk_job', 'bulk-job', 'bulkJob', 'bulkjob', 'bulk', 'bulk_upload', 'bulk-upload', 'bulk_jobs', 'bulk-jobs', 'bulkJobs', 'batch', 'multi', 'multi_job', 'multi-job', 'multijob', 'package'],
  subscription_box: ['subscription', 'subscription_box', 'subscription-box', 'subscriptionBox', 'subscriptionbox', 'sub-box', 'sub', 'monthly', 'monthly_box', 'monthly-box', 'box', 'mystery_box', 'mysteryBox', 'recurring', 'membership'],
  perk: ['perk', 'perks', 'discount', 'discounts', 'benefit', 'benefits', 'freebie', 'free', 'offer', 'offers', 'special', 'deal', 'deals', 'exclusive', 'exclusives'],
  reward: ['reward', 'rewards', 'coupon', 'coupons', 'promo', 'promotion', 'promotions', 'voucher', 'vouchers', 'credit', 'credits', 'points', 'cashback'],
}
// Keyword fragments for the fuzzy fallback. Order matters (campaign/bulk before single).
const OFFERING_KEYWORDS: Array<[string, string[]]> = [
  ['campaign', ['campaign', 'sponsor', 'partner', 'collab', 'endors', 'ambassador', 'deal']],
  ['bulk_job', ['bulk', 'batch', 'multi']],
  ['single_job', ['job', 'gig', 'appear', 'shoutout', 'autograph', 'cameo', 'voiceover', 'post', 'content']],
  ['subscription_box', ['subscript', 'monthly', 'recur', 'member', 'box']],
  ['perk', ['perk', 'discount', 'freebie', 'benefit', 'offer', 'exclus']],
  ['reward', ['reward', 'coupon', 'promo', 'voucher', 'credit', 'point', 'cashback']],
]
const NON_BRAND_AUTHOR_TYPES = new Set([
  'fan', 'fans', 'supporter', 'supporters', 'subscriber', 'subscribers',
  'member', 'members', 'consumer', 'consumers', 'user', 'users',
  'talent', 'talents', 'athlete', 'athletes', 'creator', 'creators',
  'influencer', 'influencers', 'coach', 'coaches', 'parent', 'parents',
  'individual', 'individuals',
])

const normalizeCat = (s: string): string =>
  s.toLowerCase().replace(/[-_\s]+/g, '').replace(/s$/, '')

const titleCase = (s: string): string =>
  s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export interface BrandOpportunity {
  uuid: string
  title: string
  description: string
  state: string
  price: { amount: number; currency: string } | null
  category: string
  categoryLabel: string
  nilianceUrl: string
}

export async function listBrandOpportunities(
  opts: { keywords?: string; category?: string } = {}
): Promise<BrandOpportunity[]> {
  if (!sharetribeEnabled) return []
  const sdk = await getIntegrationSdk()
  if (!sdk) return []
  try {
    const params: Record<string, unknown> = {
      include: ['author'],
      'fields.user': 'publicData,profile',
      states: 'published',
      perPage: 100,
    }
    if (opts.keywords) params.keywords = opts.keywords
    const resp = await sdk.listings.query(params)
    const listings: any[] = Array.isArray(resp?.data?.data) ? resp.data.data : []
    const included: any[] = Array.isArray(resp?.data?.included) ? resp.data.included : []

    // author uuid → userType
    const authorTypes = new Map<string, string>()
    for (const item of included) {
      if (item?.type !== 'user') continue
      const aid = typeof item.id === 'string' ? item.id : item.id?.uuid ?? ''
      const attrs = item.attributes ?? {}
      const t =
        attrs.publicData?.userType ??
        attrs.publicData?.accountType ??
        attrs.publicData?.role ??
        attrs.profile?.publicData?.userType ??
        attrs.profile?.userType ??
        ''
      if (aid) authorTypes.set(aid, String(t))
    }

    const out: BrandOpportunity[] = []
    for (const l of listings) {
      const a = l.attributes ?? l
      if (a.state && a.state !== 'published') continue

      const rawCat = String(a.publicData?.listingCategory ?? a.publicData?.category ?? '').toLowerCase()
      if (PROFILE_CATEGORIES.has(rawCat)) continue // exclude entity-profile listings

      // Canonicalize to an offering bucket (exact alias → keyword contains → other).
      const rawNorm = normalizeCat(rawCat)
      let canonical = 'other'
      for (const [bucket, vals] of Object.entries(OFFERING_MAP)) {
        if (vals.map(normalizeCat).includes(rawNorm)) {
          canonical = bucket
          break
        }
      }
      if (canonical === 'other' && rawCat) {
        outer: for (const [bucket, frags] of OFFERING_KEYWORDS) {
          for (const frag of frags) {
            if (rawCat.includes(frag)) {
              canonical = bucket
              break outer
            }
          }
        }
      }

      // Author deny-list: drop only known non-brand author types; brand + unknown pass.
      const rel = l.relationships?.author?.data?.id
      const aid = typeof rel === 'string' ? rel : rel?.uuid ?? ''
      const authorType = (aid ? authorTypes.get(aid) ?? '' : '').toLowerCase()
      if (authorType && NON_BRAND_AUTHOR_TYPES.has(authorType)) continue

      if (opts.category && canonical !== opts.category) continue

      const id = typeof l.id === 'string' ? l.id : l.id?.uuid ?? ''
      const slug =
        String(a.publicData?.slug ?? a.publicData?.permalink ?? '') ||
        (a.title ? slugify(a.title) : '') ||
        id
      let label = OFFERING_LABELS[canonical] ?? titleCase(canonical)
      if (canonical === 'other' && rawCat) label = titleCase(rawCat)

      out.push({
        uuid: id,
        title: a.title || '(untitled)',
        description: a.description || '',
        state: a.state || 'published',
        price: a.price ? { amount: a.price.amount, currency: a.price.currency } : null,
        category: canonical,
        categoryLabel: label,
        nilianceUrl: nilianceListingUrl({ id, slug, title: a.title }),
      })
    }
    return out
  } catch {
    return []
  }
}

export async function listSharetribeOpportunities(
  perPage = 100
): Promise<SharetribeListing[]> {
  if (!sharetribeEnabled) return []
  const sdk = await getMarketplaceSdk()
  if (!sdk) return []
  try {
    const resp = await sdk.listings.query({ perPage, include: ['author'] })
    const data = resp?.data?.data ?? []
    return data.map((row: any) => {
      const attrs = row.attributes ?? {}
      const price = attrs.price ? { amount: attrs.price.amount, currency: attrs.price.currency } : null
      const author = row.relationships?.author?.data?.id?.uuid ?? null
      return {
        uuid: row.id?.uuid ?? row.id,
        title: attrs.title ?? '',
        description: attrs.description ?? '',
        state: attrs.state ?? 'published',
        price,
        publicData: attrs.publicData ?? {},
        authorUuid: author,
        updatedAt: attrs.updatedAt ?? attrs.createdAt,
      }
    })
  } catch {
    return []
  }
}
