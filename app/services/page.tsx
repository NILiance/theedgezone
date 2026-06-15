import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { ServicesShowcase } from '@/components/landing/services-showcase'
import { CountUp } from '@/components/landing/count-up'
import { Button } from '@/components/ui/button'
import { SERVICES } from '@/lib/services-data'
import { createClient } from '@/lib/supabase/server'

const HERO_STATS = [
  { end: SERVICES.length, suffix: '', label: 'Services' },
  { end: 15, suffix: '', label: 'Satellites' },
  { end: 2500, suffix: '', label: 'Users Served' },
  { end: 96, suffix: '%', label: '% Satisfaction' },
] as const

export const metadata = { title: 'Services' }

async function detectAudience(): Promise<'all' | 'talent' | 'brand'> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 'all'
    // Admins keep the full catalog.
    const { data: adminRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (adminRow) return 'all'
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle()
    const t = (profile?.user_type as string | undefined) ?? ''
    if (t === 'talent') return 'talent'
    if (t === 'brand') return 'brand'
    return 'all'
  } catch {
    return 'all'
  }
}

export default async function ServicesPage() {
  const audience = await detectAudience()
  return (
    <>
      <MarketingNav />
      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-12 text-center">
          <h1 className="text-display text-5xl font-black uppercase tracking-tight sm:text-6xl">
            Your Edge Starts{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Here.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {SERVICES.length}+ tools, services, and programs designed to build, grow, and
            dominate the NIL landscape.
          </p>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-display text-4xl font-black text-primary">
                  <CountUp end={s.end} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── NIL Innovations callout ─────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <div className="rounded-[var(--radius)] border border-primary/40 bg-panel/60 p-10 shadow-elevated">
            <p className="text-display mx-auto mb-4 w-fit rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              Part of the NIL Innovations Family
            </p>
            <h2 className="text-display text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Edge Zone services are powered by NIL Innovations
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-muted-foreground">
              Every Edge Zone account is automatically linked to{' '}
              <span className="text-primary">
                NILiance &mdash; our NIL marketplace
              </span>
              . Browse free brand-offered opportunities exclusively available to qualified
              talent &mdash; campaigns, single and bulk jobs, subscription boxes, perks, and
              rewards. Plus set up your own offerings to monetize your name, image, and
              likeness.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/opportunities">
                <Button size="lg">BROWSE FREE OPPORTUNITIES →</Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  LEARN ABOUT NILIANCE
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Services Showcase (filters + grid) ──────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <ServicesShowcase
            initialAudience={audience}
            audienceLocked={audience !== 'all'}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
