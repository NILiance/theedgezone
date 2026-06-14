import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PrintButton } from './print-button'
import { toggleRoadmapItem } from './actions'

export const metadata = { title: 'My roadmap' }

export default async function TalentRoadmapPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const [{ data: phases }, { data: items }, { data: progress }, { data: profile }] = await Promise.all([
    supabase
      .from('roadmap_phases')
      .select('id, name, description, icon, position')
      .eq('published', true)
      .order('position', { ascending: true }),
    supabase
      .from('roadmap_items')
      .select(
        'id, phase_id, name, description, audience, position, recommended_action_url, recommended_action_label'
      )
      .eq('published', true)
      .order('position', { ascending: true }),
    supabase.from('user_roadmap_progress').select('item_id, completed_at').eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('display_name, user_type, sport, school')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const audience = profile?.user_type === 'brand' ? 'brand' : 'talent'
  const filteredItems = (items ?? []).filter((i) => i.audience === 'all' || i.audience === audience)
  const itemsByPhase = new Map<string | null, typeof filteredItems>()
  for (const it of filteredItems) {
    const k = it.phase_id ?? null
    if (!itemsByPhase.has(k)) itemsByPhase.set(k, [])
    itemsByPhase.get(k)!.push(it)
  }
  const completedIds = new Set((progress ?? []).map((p) => p.item_id))
  const totalItems = filteredItems.length
  const completedCount = filteredItems.filter((i) => completedIds.has(i.id)).length
  const pct = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-display text-3xl font-black tracking-tight">My roadmap</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The path from new account to NIL-ready. Check items off as you knock them out.
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-display text-lg font-bold">
            {pct}% complete{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({completedCount} of {totalItems})
            </span>
          </p>
          {profile?.display_name && (
            <p className="text-xs text-muted-foreground">
              For {profile.display_name}
              {profile.sport && ` · ${profile.sport}`}
              {profile.school && ` · ${profile.school}`}
            </p>
          )}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {(phases ?? []).map((phase) => {
          const phaseItems = itemsByPhase.get(phase.id) ?? []
          const phaseDone = phaseItems.filter((i) => completedIds.has(i.id)).length
          return (
            <section
              key={phase.id}
              className="rounded-[var(--radius)] border border-border bg-panel/40 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{phase.icon}</span>
                  <div>
                    <p className="text-display text-lg font-bold">{phase.name}</p>
                    {phase.description && (
                      <p className="text-xs text-muted-foreground">{phase.description}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {phaseDone}/{phaseItems.length} done
                </p>
              </div>
              <ul className="mt-4 space-y-2">
                {phaseItems.length === 0 && (
                  <li className="text-xs text-muted-foreground">No items yet.</li>
                )}
                {phaseItems.map((it) => {
                  const isDone = completedIds.has(it.id)
                  return (
                    <li
                      key={it.id}
                      className={`flex flex-wrap items-start gap-3 rounded-[var(--radius-sm)] border p-3 ${
                        isDone ? 'border-success/40 bg-success/5' : 'border-border bg-background'
                      }`}
                    >
                      <form action={toggleRoadmapItem} className="flex items-center">
                        <input type="hidden" name="item_id" value={it.id} />
                        <input type="hidden" name="completed" value={(!isDone).toString()} />
                        <button
                          type="submit"
                          aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs ${
                            isDone
                              ? 'border-success bg-success text-success-foreground'
                              : 'border-border bg-background text-transparent hover:border-primary'
                          }`}
                        >
                          ✓
                        </button>
                      </form>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-display text-sm font-bold ${
                            isDone ? 'text-success line-through decoration-2' : 'text-foreground'
                          }`}
                        >
                          {it.name}
                        </p>
                        {it.description && (
                          <p className="text-xs text-muted-foreground">{it.description}</p>
                        )}
                      </div>
                      {it.recommended_action_url && (
                        <Link href={it.recommended_action_url} className="print:hidden">
                          <Button size="sm" variant="outline">
                            {it.recommended_action_label ?? 'Open'}
                          </Button>
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
        {phases?.length === 0 && (
          <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
            The roadmap hasn&apos;t been published yet. Check back soon.
          </p>
        )}
      </div>
    </div>
  )
}
