'use server'

import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

const CLAUDE_MODEL = 'claude-sonnet-4-6'

export interface AiPopularityResult {
  ok: boolean
  error?: string
  athlete_popularity?: number
  team_popularity?: number
  market_size?: number
  adjustment_factor?: number
  reasoning?: { athlete?: string; team?: string; market?: string; adjustment?: string }
}

// Rubrics distilled verbatim from the spreadsheet's factor sheets
// (Athlete / Team / Market Popularity Factors + Adjustment Rating Factors).
// The sheet marks these four inputs "Automated AI Calculation".
const RUBRIC = `You score an NIL (Name/Image/Likeness) college/amateur athlete on four factors used by the official NILfluence model. Use these rubrics:

ATHLETE POPULARITY (0–100) — individual fame & marketability:
- 100: National award (Heisman, Wooden, National POY), projected top-5 pro draft pick, constant trending athlete (e.g. Caleb Williams, Angel Reese, Livvy Dunne), 5M+ followers.
- 80–95: Conference POY / All-American, projected 1st-round pick, 500K–5M followers, regular national TV.
- 50–79: Solid starter, regional following, some media.
- Below 50: Bench/backup, <100K followers, little coverage.
Weigh: awards, draft stock, performance, social reach, media coverage, program prestige, signature moments, search trends, charisma.

TEAM POPULARITY (0–100) — the program's pull:
- 100: Blue-blood with recent national titles & 5M+ followers (Alabama/Georgia FB, Duke/UConn BB); SEC/Big Ten/ACC/Big 12 powerhouse; 100K+ attendance.
- 75–95: Strong Power-5 or top program (Tennessee, Kentucky BB, TCU).
- 50–74: Mid-major with national moments (Boise State, San Diego State).
- Below 50: FCS / low-major / historically weak.
Weigh: championships, conference, social following, attendance, TV exposure, rivalries, pro pipeline.

MARKET SIZE (0–100) — location-based NIL potential:
- 100: Top-5 market / NIL-friendly mega city (Los Angeles, New York, Chicago, Atlanta; Austin TX, Miami FL — strong NIL-law states CA/TX/FL).
- 75–95: Strong markets / passionate college towns (Seattle, Nashville, Tuscaloosa AL, Lincoln NE).
- 50–74: Mid markets (Oxford MS, Boise ID).
- Below 50: Small/rural, restrictive NIL state, low fan engagement.
Weigh: city size, corporate HQ presence, media-market rank, NIL-law friendliness, college-sports culture, fewer pro teams = more attention, disposable income.

ADJUSTMENT FACTOR (0–48) — brand-safety & reputation. PRIMARILY: is this athlete safe and positive for a brand to partner with — no legal issues, no controversy, a good reputation? Default a clean-record athlete with no known problems to ~32–40; do NOT penalize someone just for being lesser-known.
- 40–48: Clean reputation, zero controversy or legal issues, professional & positive public image, brand-friendly (existing endorsements, charisma, social-cause work, broad/crossover appeal).
- 25–39: No known problems, generally positive standing; endorsements/charisma still developing.
- 10–24: Some concern — minor PR issues, polarizing image, or a thin/unknown reputation.
- Below 10: Serious red flags — legal trouble, suspensions, scandals, or reputation risk.
Weigh reputation & brand-safety FIRST, then charisma, endorsements, social causes, crossover/international reach.`

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function clampInt(v: unknown, lo: number, hi: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return lo
  return Math.max(lo, Math.min(hi, n))
}

/**
 * AI-scores the four "Automated AI Calculation" inputs (athlete/team/market
 * popularity + adjustment factor) from the talent's profile, using the
 * spreadsheet's factor rubrics. Returns the scores + one-line reasoning each.
 */
export async function aiPopularity(): Promise<AiPopularityResult> {
  const user = await requireUser()
  if (!env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'AI scoring is offline (no API key configured).' }
  }
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, sport, athletic_position, school, conference, division, jersey_number, hometown, city, us_state, bio, achievements'
    )
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return { ok: false, error: 'No profile found to score.' }

  const athleteDesc = [
    `Name: ${profile.display_name ?? 'Unknown'}`,
    `Sport: ${profile.sport ?? '—'}`,
    `Position: ${profile.athletic_position ?? '—'}`,
    `School / Team: ${profile.school ?? '—'}`,
    `Conference: ${profile.conference ?? '—'}`,
    `Division: ${profile.division ?? '—'}`,
    `Jersey #: ${profile.jersey_number ?? '—'}`,
    `City / Market: ${profile.city ?? profile.hometown ?? '—'}${profile.us_state ? `, ${profile.us_state}` : ''}`,
    `Bio: ${(profile.bio ?? '').slice(0, 800) || '—'}`,
    `Achievements: ${(profile.achievements ?? '').slice(0, 800) || '—'}`,
  ].join('\n')

  const prompt = `${RUBRIC}

ATHLETE PROFILE:
${athleteDesc}

Using the rubrics and your knowledge of this athlete, their team, and their market, score them honestly (don't inflate). Respond with ONLY a JSON object, no prose, no markdown fences:
{"athlete_popularity": <int 0-100>, "team_popularity": <int 0-100>, "market_size": <int 0-100>, "adjustment_factor": <int 0-48>, "reasoning": {"athlete": "<one short sentence>", "team": "<one short sentence>", "market": "<one short sentence>", "adjustment": "<one short sentence>"}}`

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const res = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join('')
    const json = extractJson(text)
    if (!json) return { ok: false, error: 'AI returned an unreadable response. Try again.' }
    const reasoning = (json.reasoning ?? {}) as Record<string, string>
    return {
      ok: true,
      athlete_popularity: clampInt(json.athlete_popularity, 0, 100),
      team_popularity: clampInt(json.team_popularity, 0, 100),
      market_size: clampInt(json.market_size, 0, 100),
      adjustment_factor: clampInt(json.adjustment_factor, 0, 48),
      reasoning: {
        athlete: reasoning.athlete,
        team: reasoning.team,
        market: reasoning.market,
        adjustment: reasoning.adjustment,
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI request failed.' }
  }
}
