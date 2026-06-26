import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PlanActions } from './plan-actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Your NIL Roadmap' }

interface Recommendation {
  id: string
  title: string
  tagline: string
  price: string
  category: string
  icon: string
}

const GRADE_COLOR: Record<string, string> = {
  A: '#2ecc71',
  B: '#C8A84E',
  C: '#f39c12',
  D: '#e67e22',
  F: '#e74c3c',
}

export default async function RoadmapPlanPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createServiceClient()
  if (!supabase) notFound()

  const { data: plan } = await supabase
    .from('roadmap_plans')
    .select('score, grade, intake, recommendations, created_at')
    .eq('share_token', token)
    .maybeSingle()
  if (!plan) notFound()

  const score = (plan.score as number | null) ?? 0
  const grade = (plan.grade as string | null) ?? 'F'
  const color = GRADE_COLOR[grade] ?? '#e74c3c'
  const recs = (plan.recommendations as Recommendation[] | null) ?? []
  const intake = (plan.intake as { goals?: string[]; timeline?: string } | null) ?? {}

  // The shared phase roadmap (admin-curated).
  const { data: phases } = await supabase
    .from('roadmap_phases')
    .select('id, name, description, icon, position')
    .eq('published', true)
    .order('position', { ascending: true })

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-eyebrow text-accent">Your NIL Roadmap</p>
          <h1 className="text-display mt-1 text-4xl font-black tracking-tight">
            Your path forward
          </h1>
          {intake.timeline && (
            <p className="mt-1 text-sm text-muted-foreground">{intake.timeline} plan</p>
          )}
        </div>
        <PlanActions token={token} />
      </div>

      {/* Score */}
      <section className="mt-8 flex flex-wrap items-center gap-6 rounded-[var(--radius)] border border-border bg-panel/40 p-6">
        <div
          className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-4"
          style={{ borderColor: color }}
        >
          <span className="text-display text-3xl font-black" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
        </div>
        <div>
          <p className="text-display text-2xl font-black" style={{ color }}>
            NIL Readiness: {grade}
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Your readiness score measures how prepared you are to maximize your name, image, and
            likeness — across profile, services, social reach, and goals.
          </p>
        </div>
      </section>

      {/* Recommendations */}
      <section className="mt-8">
        <p className="text-eyebrow mb-3 text-primary">Recommended next moves</p>
        {recs.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            Browse the full catalog to find your next service.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((r) => (
              <Link
                key={r.id}
                href={`/services/${r.id}`}
                className="group rounded-[var(--radius)] border border-border bg-panel/40 p-4 transition-colors hover:border-primary/40"
              >
                <p className="text-2xl">{r.icon}</p>
                <p className="text-display mt-2 font-bold group-hover:text-primary">{r.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.tagline}</p>
                <p className="mt-2 text-sm font-bold text-primary">{r.price}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Phase roadmap */}
      {(phases ?? []).length > 0 && (
        <section className="mt-8">
          <p className="text-eyebrow mb-3 text-primary">Your roadmap phases</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(phases ?? []).map((p) => (
              <div key={p.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
                <p className="text-2xl">{p.icon}</p>
                <p className="text-display mt-1 font-bold">{p.name}</p>
                {p.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-2">
        <Link
          href="/services"
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground"
        >
          Browse all services →
        </Link>
        <Link
          href="/dashboard/roadmap/build"
          className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-panel"
        >
          Build a new roadmap
        </Link>
      </div>
    </main>
  )
}
