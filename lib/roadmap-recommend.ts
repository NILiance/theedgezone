import { SERVICES, type Service, type Audience, type CategoryKey } from './services-data'

/**
 * Parse a display price ("$29/mo", "$199", "$9.99/mo", "Free / Custom") to an
 * approximate dollar number for budget filtering. Free / custom → 0.
 */
export function priceToNumber(price: string): number {
  if (/free/i.test(price) && !/\$/.test(price)) return 0
  const m = price.match(/\$\s*([\d,]+(?:\.\d+)?)/)
  if (!m) return 0
  return Math.round(parseFloat(m[1]!.replace(/,/g, '')) || 0)
}

export interface RecommendInput {
  categories: CategoryKey[]
  budget: number // monthly $ ceiling (0 = no limit)
  audience: Audience
  limit?: number
}

/**
 * Recommend services: in-focus categories within budget first, then broaden to
 * any in-budget service for the audience. Free/custom services always qualify.
 */
export function recommendServices(input: RecommendInput): Service[] {
  const limit = input.limit ?? 6
  const focus = new Set(input.categories)
  const inBudget = (s: Service) =>
    input.budget <= 0 || priceToNumber(s.price) <= input.budget

  const forAudience = SERVICES.filter((s) => s.audience.includes(input.audience) && inBudget(s))

  const ranked = [...forAudience].sort((a, b) => {
    const af = focus.has(a.category) ? 0 : 1
    const bf = focus.has(b.category) ? 0 : 1
    if (af !== bf) return af - bf
    // Within the same focus tier, prefer "popular", then cheaper.
    const ap = a.status === 'popular' ? 0 : 1
    const bp = b.status === 'popular' ? 0 : 1
    if (ap !== bp) return ap - bp
    return priceToNumber(a.price) - priceToNumber(b.price)
  })

  return ranked.slice(0, limit)
}
