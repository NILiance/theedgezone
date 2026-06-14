import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicMilestonePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: milestone } = await supabase
    .from('climb_milestones')
    .select(
      'id, slug, title, summary, position, hero_image_url, video_url, slides, cta_label, cta_url, duration_min, audience'
    )
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (!milestone) notFound()

  const slides = Array.isArray(milestone.slides)
    ? (milestone.slides as Array<{ heading?: string; body?: string; media_url?: string }>)
    : []

  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/path-to-the-summit"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Path to the Summit
        </Link>
        <header className="mt-6">
          <p className="text-eyebrow text-primary">Milestone #{milestone.position + 1}</p>
          <h1 className="text-display mt-2 text-4xl font-black tracking-tight">
            {milestone.title}
          </h1>
          {milestone.summary && (
            <p className="mt-3 text-lg text-muted-foreground">{milestone.summary}</p>
          )}
          {milestone.duration_min && (
            <p className="mt-2 text-xs text-muted-foreground">~ {milestone.duration_min} min</p>
          )}
        </header>

        {milestone.hero_image_url && (
          <div className="mt-8 overflow-hidden rounded-[var(--radius)] border border-border">
            <Image
              src={milestone.hero_image_url}
              alt={milestone.title}
              width={1200}
              height={600}
              className="h-auto w-full object-cover"
              unoptimized
            />
          </div>
        )}

        {milestone.video_url && (
          <div className="mt-8 overflow-hidden rounded-[var(--radius)] border border-border">
            <div className="aspect-video">
              <iframe
                src={milestone.video_url}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {slides.length > 0 && (
          <section className="mt-10 space-y-6">
            {slides.map((slide, i) => (
              <article
                key={i}
                className="rounded-[var(--radius)] border border-border bg-panel/40 p-6"
              >
                {slide.heading && (
                  <h2 className="text-display text-xl font-bold">{slide.heading}</h2>
                )}
                {slide.body && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {slide.body}
                  </p>
                )}
                {slide.media_url && (
                  <Image
                    src={slide.media_url}
                    alt=""
                    width={800}
                    height={500}
                    className="mt-4 h-auto w-full rounded-[var(--radius-sm)] object-cover"
                    unoptimized
                  />
                )}
              </article>
            ))}
          </section>
        )}

        {milestone.cta_url && (
          <div className="mt-10 rounded-[var(--radius)] border border-primary/40 bg-panel/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">Ready to take action?</p>
            <Link href={milestone.cta_url} className="mt-4 inline-block">
              <Button size="lg">{milestone.cta_label ?? 'Continue'}</Button>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
