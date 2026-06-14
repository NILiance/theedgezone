import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export const metadata = {
  title: 'Path to the Summit',
  description:
    'A step-by-step climb from setting up your profile to running an NIL-ready business. Free guided journey.',
}

export default async function PathToTheSummitPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const { data: milestones } = await supabase
    .from('climb_milestones')
    .select('id, slug, title, summary, position, hero_image_url, duration_min, audience')
    .eq('published', true)
    .order('position', { ascending: true })

  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-eyebrow text-accent">The Climb</p>
          <h1 className="text-display mt-3 text-5xl font-black uppercase tracking-tight sm:text-6xl">
            Path to the{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Summit.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A guided climb from new account to NIL-ready operator. Each stop is a short
            walk-through you can knock out in 10–20 minutes. Free.
          </p>
          {!user && (
            <div className="mt-8">
              <Link href="/sign-up">
                <Button size="lg">Sign up to start the climb →</Button>
              </Link>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          <ol className="relative space-y-6 border-l-2 border-border pl-8">
            {(milestones ?? []).map((m, idx) => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[2.6rem] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-display text-sm font-black">{idx + 1}</span>
                </span>
                <article className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
                  <h3 className="text-display text-xl font-black">{m.title}</h3>
                  {m.summary && (
                    <p className="mt-2 text-sm text-muted-foreground">{m.summary}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {m.duration_min && <span>~ {m.duration_min} min</span>}
                    {m.audience !== 'all' && (
                      <span className="text-primary">For {m.audience}</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={
                        user
                          ? `/dashboard/climb#${m.slug}`
                          : `/path-to-the-summit/${m.slug}`
                      }
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {user ? 'Open in dashboard →' : 'Preview →'}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
            {(milestones ?? []).length === 0 && (
              <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
                The path is being charted. Check back soon.
              </p>
            )}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  )
}
