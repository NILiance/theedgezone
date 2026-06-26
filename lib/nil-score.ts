/**
 * NIL Readiness Score — four 25-point components (profile completeness,
 * services owned with diminishing returns, social reach tiers, goals set),
 * replicating the legacy ez_calculate_nil_score formula.
 */

export interface NilScoreInput {
  profileCompletionPct: number
  servicesOwned: number
  totalFollowers: number
  goalsCount: number
}

export interface NilScore {
  total: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  color: string
  breakdown: { profile: number; products: number; social: number; goals: number }
  tips: string[]
}

export function computeNilScore(i: NilScoreInput): NilScore {
  const profile = Math.min(25, Math.round(((i.profileCompletionPct || 0) * 25) / 100))
  const products = Math.min(
    25,
    Math.round(25 * (1 - Math.pow(0.75, Math.max(0, i.servicesOwned || 0))))
  )
  const f = Math.max(0, i.totalFollowers || 0)
  const social = f >= 100000 ? 25 : f >= 10000 ? 20 : f >= 1000 ? 12 : f > 0 ? 5 : 0
  const goals = Math.min(25, Math.max(0, i.goalsCount || 0) * 4)

  const total = Math.min(100, Math.max(0, profile + products + social + goals))
  const grade = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : total >= 20 ? 'D' : 'F'
  const color =
    total >= 80 ? '#2ecc71' : total >= 60 ? '#C8A84E' : total >= 40 ? '#f39c12' : '#e74c3c'

  const tips: string[] = []
  if (profile < 25) tips.push(`Complete your profile (+${25 - profile} pts)`)
  if ((i.servicesOwned || 0) < 3) tips.push('Explore more Edge Zone services')
  if (social < 12) tips.push(`Grow your social following (+${25 - social} pts)`)
  if ((i.goalsCount || 0) < 5) tips.push(`Set more goals (+${Math.min(25 - goals, 20)} pts)`)

  return { total, grade, color, breakdown: { profile, products, social, goals }, tips }
}
