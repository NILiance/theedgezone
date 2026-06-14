/**
 * NILiance / Sharetribe opportunity helpers.
 *
 * Opportunities = Sharetribe Marketplace listings. We mirror them in
 * public.opportunities so browsing doesn't hit Sharetribe live. The cron
 * at /api/cron/niliance-poll keeps the mirror fresh.
 */
import { getIntegrationSdk, getMarketplaceSdk, sharetribeEnabled } from '@/lib/sharetribe'

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
