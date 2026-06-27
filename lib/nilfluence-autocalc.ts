/**
 * Auto-calculates the three "popularity" inputs from a talent's profile —
 * a starting point the talent can adjust manually.
 *
 * - Athlete popularity: blends bio length, achievements length, jersey
 *   number presence, social count, and verified-handle hits.
 * - Team popularity: rewards Power-5 conferences, D1/FBS, well-known
 *   schools.
 * - Market size: rewards top-tier media markets and major sports states.
 */

interface ProfileLike {
  display_name?: string | null
  sport?: string | null
  athletic_position?: string | null
  school?: string | null
  conference?: string | null
  division?: string | null
  jersey_number?: string | null
  hometown?: string | null
  city?: string | null
  us_state?: string | null
  bio?: string | null
  achievements?: string | null
  socials?: Record<string, string> | null
  phyllo_user_id?: string | null
}

const POWER_FIVE = new Set([
  'sec', 'big ten', 'big 10', 'big 12', 'acc', 'pac-12', 'pac 12', 'pac-10',
])
const STRONG_CONFS = new Set([
  'aac', 'mountain west', 'sun belt', 'mac', 'cusa', 'big east', 'wcc', 'a-10', 'atlantic 10',
])
const D1_TOKENS = ['d1', 'd-1', 'division 1', 'division i', 'fbs', 'fcs']

const TOP_MARKETS = new Set([
  'new york', 'los angeles', 'chicago', 'philadelphia', 'dallas', 'houston',
  'washington', 'atlanta', 'boston', 'san francisco', 'phoenix', 'seattle',
  'miami', 'detroit', 'minneapolis', 'denver', 'tampa', 'orlando',
])
const STRONG_MARKETS = new Set([
  'austin', 'nashville', 'charlotte', 'pittsburgh', 'cleveland', 'st louis', 'st. louis',
  'kansas city', 'indianapolis', 'columbus', 'baltimore', 'san diego', 'portland',
  'sacramento', 'las vegas', 'jacksonville', 'cincinnati', 'milwaukee',
])
const BIG_SPORTS_STATES = new Set([
  'TX', 'CA', 'FL', 'NY', 'GA', 'OH', 'PA', 'IL', 'NC', 'AL', 'TN', 'MI',
])

// An athlete's NIL market is really their SCHOOL's city, not their hometown.
// Curated market scores for major programs (the on-load estimate refines the
// long tail). First match wins, so order specific patterns before broad ones.
const SCHOOL_MARKETS: Array<[RegExp, number]> = [
  [/\b(usc|southern california|ucla)\b/, 100], // Los Angeles
  [/\bsmu\b|southern methodist/, 90], // Dallas
  [/\btcu\b|texas christian/, 88], // Fort Worth–Dallas
  [/villanova|\btemple\b|drexel/, 88], // Philadelphia
  [/texas a&m/, 82], // College Station
  [/\btexas\b(?!.*(tech|a&m|state|el paso|san antonio|arlington))/, 95], // UT Austin
  [/ohio state/, 90], // Columbus
  [/\bmiami\b(?!.*ohio)/, 90], // Miami FL
  [/washington\b(?!.*state)/, 88], // Seattle
  [/\blsu\b|louisiana state/, 88], // Baton Rouge
  [/arizona state|\basu\b/, 85], // Phoenix
  [/colorado\b(?!.*state)/, 82], // Boulder–Denver
  [/alabama\b(?!.*(birmingham|huntsville|a&m|state))/, 85], // Tuscaloosa
  [/\bgeorgia\b(?!.*(tech|state|southern))/, 85], // Athens
  [/\bflorida\b(?!.*(state|atlantic|international|gulf))/, 85], // Gainesville
  [/oklahoma\b(?!.*state)/, 85], // Norman
  [/oregon\b(?!.*state)/, 82], // Eugene
  [/tennessee\b(?!.*(state|tech|martin|chattanooga))/, 82], // Knoxville
  [/nebraska/, 82], // Lincoln
  [/rutgers/, 82], // NJ / NYC metro
  [/michigan\b(?!.*state)/, 80], // Ann Arbor
  [/notre dame/, 80],
  [/penn state/, 80], // State College
  [/wisconsin/, 80], // Madison
  [/kentucky\b(?!.*(western|eastern))/, 80], // Lexington
  [/florida state|\bfsu\b/, 80],
  [/\bkansas\b(?!.*state)/, 78], // Lawrence
  [/north carolina\b(?!.*(state|a&t|charlotte|greensboro|wilmington))|\bunc\b/, 78], // Chapel Hill
  [/\bduke\b/, 78], // Durham
  [/louisville/, 78],
  [/auburn/, 78],
  [/clemson/, 75],
  [/\biowa\b(?!.*state)/, 76], // Iowa City
  [/\bbaylor\b/, 75], // Waco
  [/\butah\b(?!.*state)/, 75],
  [/syracuse/, 72],
  [/uconn|\bconnecticut\b/, 72],
  [/mississippi\b(?!.*state)|ole miss/, 70], // Oxford
  [/gonzaga/, 65],
]

function schoolMarket(school?: string | null): number {
  const s = (school ?? '').toLowerCase()
  if (!s) return 0
  for (const [re, score] of SCHOOL_MARKETS) if (re.test(s)) return score
  return 0
}

export function autoAthletePopularity(profile: ProfileLike): number {
  let score = 35 // baseline for any signed-in talent
  if ((profile.bio?.length ?? 0) > 200) score += 8
  if ((profile.bio?.length ?? 0) > 600) score += 6
  if ((profile.achievements?.length ?? 0) > 200) score += 8
  if ((profile.achievements?.length ?? 0) > 600) score += 6
  if (profile.jersey_number) score += 3
  if (profile.athletic_position) score += 3
  if (profile.phyllo_user_id) score += 8 // connected socials = stronger presence
  const socialCount = Object.values(profile.socials ?? {}).filter(Boolean).length
  score += Math.min(socialCount * 5, 20)
  return clampPct(score)
}

export function autoTeamPopularity(profile: ProfileLike): number {
  let score = 25
  const conf = (profile.conference ?? '').toLowerCase().trim()
  if (POWER_FIVE.has(conf)) score += 45
  else if (STRONG_CONFS.has(conf)) score += 25
  else if (conf) score += 12
  const div = (profile.division ?? '').toLowerCase().trim()
  if (D1_TOKENS.some((t) => div.includes(t))) score += 15
  // School presence is a small bump on top.
  if ((profile.school?.length ?? 0) > 0) score += 5
  return clampPct(score)
}

export function autoMarketSize(profile: ProfileLike): number {
  let score = 30
  const city = ((profile.city ?? profile.hometown ?? '').toLowerCase().split(',')[0] ?? '').trim()
  if (city && TOP_MARKETS.has(city)) score += 45
  else if (city && STRONG_MARKETS.has(city)) score += 25
  else if (city) score += 10
  const state = (profile.us_state ?? '').trim().toUpperCase()
  if (BIG_SPORTS_STATES.has(state)) score += 15
  else if (state) score += 5
  return clampPct(score)
}

export interface AutoPopularity {
  athlete: number
  team: number
  market: number
  notes: { athlete: string; team: string; market: string }
}

export function autoPopularityFromProfile(profile: ProfileLike): AutoPopularity {
  const athlete = autoAthletePopularity(profile)
  const team = autoTeamPopularity(profile)
  const market = autoMarketSize(profile)
  const notes = {
    athlete: explainAthlete(profile),
    team: explainTeam(profile),
    market: explainMarket(profile),
  }
  return { athlete, team, market, notes }
}

function explainAthlete(p: ProfileLike): string {
  const parts: string[] = []
  parts.push('starts at 35 baseline')
  if ((p.bio?.length ?? 0) > 200) parts.push('+ bio')
  if ((p.achievements?.length ?? 0) > 200) parts.push('+ achievements')
  if (p.phyllo_user_id) parts.push('+ socials verified')
  const socialCount = Object.values(p.socials ?? {}).filter(Boolean).length
  if (socialCount > 0) parts.push(`+ ${socialCount} social handles`)
  return parts.join(', ')
}

function explainTeam(p: ProfileLike): string {
  const conf = (p.conference ?? '').toLowerCase()
  if (POWER_FIVE.has(conf)) return `Power-5 conference (${p.conference})`
  if (STRONG_CONFS.has(conf)) return `Strong conference (${p.conference})`
  if (conf) return `Conference: ${p.conference}`
  return 'Conference unknown — fill in your school to refine'
}

function explainMarket(p: ProfileLike): string {
  const city = ((p.city ?? p.hometown ?? '').toLowerCase().split(',')[0] ?? '').trim()
  if (city && TOP_MARKETS.has(city)) return `Top-10 media market: ${p.city ?? p.hometown}`
  if (city && STRONG_MARKETS.has(city)) return `Strong market: ${p.city ?? p.hometown}`
  if (city) return `Market: ${p.city ?? p.hometown}`
  return 'City unknown — fill in your hometown / city to refine'
}

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}
