'use server'

import { randomUUID } from 'node:crypto'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { computeNilScore } from '@/lib/nil-score'
import { recommendServices } from '@/lib/roadmap-recommend'
import type { Audience, CategoryKey } from '@/lib/services-data'

export interface RoadmapIntake {
  goals: string[]
  categories: string[]
  budget: number
  timeline: string
  followers: number
}

export async function generateRoadmapPlan(
  intake: RoadmapIntake
): Promise<{ ok: boolean; token?: string; message?: string }> {
  const user = await requireUser()
  const supabase = await createClient()

  const [{ data: profile }, { count: ordersCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('profile_completion_pct, user_type')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])
  const audience: Audience =
    (profile as { user_type?: string } | null)?.user_type === 'brand' ? 'brand' : 'talent'
  const completion =
    (profile as { profile_completion_pct?: number } | null)?.profile_completion_pct ?? 0

  const score = computeNilScore({
    profileCompletionPct: completion,
    servicesOwned: ordersCount ?? 0,
    totalFollowers: intake.followers || 0,
    goalsCount: (intake.goals ?? []).length,
  })

  const recommendations = recommendServices({
    categories: (intake.categories ?? []) as CategoryKey[],
    budget: intake.budget || 0,
    audience,
    limit: 6,
  }).map((s) => ({
    id: s.id,
    title: s.title,
    tagline: s.tagline,
    price: s.price,
    category: s.category,
    icon: s.icon,
  }))

  const token = randomUUID().replace(/-/g, '').slice(0, 24)
  const { error } = await supabase.from('roadmap_plans').insert({
    user_id: user.id,
    share_token: token,
    intake: { ...intake, audience },
    score: score.total,
    grade: score.grade,
    recommendations,
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true, token }
}

export async function emailRoadmapPlan(
  token: string,
  origin: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  if (!user.email) return { ok: false, message: 'No email on file.' }
  const link = `${origin}/roadmap/plan/${token}`
  const res = await sendEmail({
    to: user.email,
    subject: 'Your personalized NIL roadmap',
    templateKey: 'nil_roadmap',
    html: `<p>Here's your personalized NIL roadmap from Edge Zone:</p>
<p><a href="${link}">${link}</a></p>
<p>It includes your NIL readiness score and the services we recommend next.</p>`,
    metadata: { token },
  })
  return res.success ? { ok: true } : { ok: false, message: res.error }
}
