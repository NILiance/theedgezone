import Link from 'next/link'
import Image from 'next/image'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { toggleClimbMilestone } from './actions'

export const metadata = { title: 'My climb' }

export default async function TalentClimbPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const [{ data: milestones }, { data: progress }, { data: profile }] = await Promise.all([
    supabase
      .from('climb_milestones')
      .select(
        'id, slug, title, summary, position, hero_image_url, video_url, cta_label, cta_url, duration_min, audience'
      )
      .eq('published', true)
      .order('position', { ascending: true }),
    supabase
      .from('user_climb_progress')
      .select('milestone_id, completed_at')
      .eq('user_id', user.id),
    supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle(),
  ])

  const audience = profile?.user_type === 'brand' ? 'brand' : 'talent'
  const filtered = (milestones ?? []).filter(
    (m) => m.audience === 'all' || m.audience === audience
  )
  const completedIds = new Set((progress ?? []).map((p) => p.milestone_id))
  const totalCount = filtered.length
  const doneCount = filtered.filter((m) => completedIds.has(m.id)).length
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="text-display mt-3 text-3xl font-black tracking-tight">My climb</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Path to the Summit. Each milestone unlocks something practical in your account.
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-display text-lg font-bold">
            {pct}% climbed{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({doneCount} of {totalCount})
            </span>
          </p>
          <Link href="/path-to-the-summit" className="text-xs text-primary hover:underline">
            Public view
          </Link>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="relative space-y-6 border-l-2 border-border pl-8">
        {filtered.map((m, idx) => {
          const isDone = completedIds.has(m.id)
          return (
            <li id={m.slug} key={m.id} className="relative">
              <span
                className={`absolute -left-[2.6rem] flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isDone
                    ? 'bg-success text-success-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <span className="text-display text-sm font-black">{isDone ? '✓' : idx + 1}</span>
              </span>
              <article
                className={`rounded-[var(--radius)] border p-5 ${
                  isDone ? 'border-success/40 bg-success/5' : 'border-border bg-panel/40'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-display text-xl font-black">{m.title}</h3>
                  {m.duration_min && (
                    <span className="text-xs text-muted-foreground">{m.duration_min} min</span>
                  )}
                </div>
                {m.summary && (
                  <p className="mt-2 text-sm text-muted-foreground">{m.summary}</p>
                )}

                {m.hero_image_url && (
                  <div className="mt-4 overflow-hidden rounded-[var(--radius-sm)] border border-border">
                    <Image
                      src={m.hero_image_url}
                      alt=""
                      width={1200}
                      height={500}
                      className="h-auto w-full object-cover"
                      unoptimized
                    />
                  </div>
                )}
                {m.video_url && (
                  <div className="mt-4 overflow-hidden rounded-[var(--radius-sm)] border border-border">
                    <div className="aspect-video">
                      <iframe
                        src={m.video_url}
                        className="h-full w-full"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {m.cta_url && (
                    <Link href={m.cta_url}>
                      <Button size="sm">{m.cta_label ?? 'Open'}</Button>
                    </Link>
                  )}
                  <form action={toggleClimbMilestone}>
                    <input type="hidden" name="milestone_id" value={m.id} />
                    <input type="hidden" name="completed" value={(!isDone).toString()} />
                    <Button type="submit" size="sm" variant={isDone ? 'ghost' : 'outline'}>
                      {isDone ? '✓ Done · undo' : 'Mark complete'}
                    </Button>
                  </form>
                </div>
              </article>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
            The climb hasn&apos;t been charted yet.
          </p>
        )}
      </ol>
    </div>
  )
}
