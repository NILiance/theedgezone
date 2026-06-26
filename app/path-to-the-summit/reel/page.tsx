import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { createClient } from '@/lib/supabase/server'
import { ReelPlayer, type ReelItem } from './reel-player'

export const metadata = {
  title: 'The Climb — Reel',
  description: 'Watch the Path to the Summit reel: a guided climb from new account to NIL-ready.',
}

export default async function ClimbReelPage() {
  const supabase = await createClient()

  const { data: reel } = await supabase
    .from('climb_reel')
    .select('title, subtitle, milestone_ids, published')
    .eq('singleton', true)
    .maybeSingle()

  if (!reel || !reel.published) notFound()

  const ids = Array.isArray(reel.milestone_ids) ? (reel.milestone_ids as string[]) : []
  if (ids.length === 0) notFound()

  // Pull the referenced milestones, then re-order to match the saved sequence
  // and drop any that lost their video.
  const { data: milestones } = await supabase
    .from('climb_milestones')
    .select('id, title, summary, video_url, published')
    .in('id', ids)
    .eq('published', true)

  const byId = new Map((milestones ?? []).map((m) => [m.id, m]))
  const items: ReelItem[] = ids
    .map((id) => byId.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m && m.video_url))
    .map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.summary ?? null,
      video_url: m.video_url as string,
    }))

  if (items.length === 0) notFound()

  return (
    <>
      <MarketingNav />
      <main className="bg-[#0a0e14] text-white">
        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-8 text-center">
            <p className="text-eyebrow text-accent">The Climb · Reel</p>
            <h1 className="text-display mt-3 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              {reel.title}
            </h1>
            {reel.subtitle && (
              <p className="mx-auto mt-3 max-w-2xl text-white/60">{reel.subtitle}</p>
            )}
            <Link
              href="/path-to-the-summit"
              className="mt-4 inline-block text-xs font-bold text-primary hover:underline"
            >
              ← Back to the full climb
            </Link>
          </div>

          <ReelPlayer items={items} />
        </section>
      </main>
      <Footer />
    </>
  )
}
