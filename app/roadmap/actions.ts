'use server'

import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { computeNilScore } from '@/lib/nil-score'
import { recommendServices } from '@/lib/roadmap-recommend'
import type { Audience, CategoryKey } from '@/lib/services-data'

export interface PublicRoadmapInput {
  persona: string
  sport: string
  social: string
  priorities: string[]
  budget: string
}

// Quiz budget tier → monthly $ ceiling (0 = no limit; 1 = free services only).
const BUDGET_DOLLARS: Record<string, number> = {
  free: 1,
  under_25: 25,
  '25_50': 50,
  '50_100': 100,
  '100_300': 300,
  '300+': 0,
}

// Quiz social tier → an approximate total-following number for the score.
const SOCIAL_FOLLOWERS: Record<string, number> = {
  none: 0,
  '1k': 500,
  '10k': 5000,
  '100k': 50000,
  '100k+': 200000,
  unsure: 0,
}

// Quiz priority → service category we weight recommendations toward.
const PRIORITY_CATEGORY: Record<string, CategoryKey> = {
  brand_deals: 'revenue-monetization',
  merch: 'revenue-monetization',
  following: 'marketing-growth',
  budget_nil: 'marketing-growth',
  personal_brand: 'brand-design',
  digital_identity: 'digital-presence',
  content: 'marketing-growth',
  learn_nil: 'education-development',
  performance: 'health-wellness',
  health: 'health-wellness',
  protect_nil: 'professional-services',
  finance: 'professional-services',
  contracts: 'professional-services',
  nil_deal: 'revenue-monetization',
  after_sports: 'career-readiness',
  network: 'career-readiness',
}

/**
 * Builds a personalized roadmap from the public Free Roadmap quiz — no account
 * required. Maps the quiz answers to an NIL readiness score + recommended
 * services, stores an anonymous plan, and returns its share token so the quiz
 * can send the visitor to /roadmap/plan/[token].
 */
export async function generatePublicRoadmapPlan(
  input: PublicRoadmapInput
): Promise<{ ok: boolean; token?: string; message?: string }> {
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Roadmap service is unavailable right now.' }

  const audience: Audience = input.persona === 'brand' ? 'brand' : 'talent'
  const budget = BUDGET_DOLLARS[input.budget] ?? 0
  const followers = SOCIAL_FOLLOWERS[input.social] ?? 0
  const categories = Array.from(
    new Set((input.priorities ?? []).map((p) => PRIORITY_CATEGORY[p]).filter(Boolean))
  ) as CategoryKey[]

  const score = computeNilScore({
    profileCompletionPct: 0,
    servicesOwned: 0,
    totalFollowers: followers,
    goalsCount: (input.priorities ?? []).length,
  })

  const recommendations = recommendServices({ categories, budget, audience, limit: 6 }).map((s) => ({
    id: s.id,
    title: s.title,
    tagline: s.tagline,
    price: s.price,
    category: s.category,
    icon: s.icon,
  }))

  const token = randomUUID().replace(/-/g, '').slice(0, 24)
  const { error } = await supabase.from('roadmap_plans').insert({
    user_id: null,
    share_token: token,
    intake: {
      audience,
      persona: input.persona,
      sport: input.sport,
      social: input.social,
      goals: input.priorities ?? [],
      categories,
      budget,
      followers,
    },
    score: score.total,
    grade: score.grade,
    recommendations,
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true, token }
}
