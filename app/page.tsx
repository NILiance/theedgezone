import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Faq } from '@/components/landing/faq'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

const STATS = [
  { value: '30+', label: 'Services Available' },
  { value: '500+', label: 'Talent & Brands' },
  { value: '100%', label: 'Free to Join' },
  { value: '24/7', label: 'Access Your Tools' },
]

const BUILT_FOR = [
  {
    icon: '🏆',
    title: 'For Talent',
    body: 'Build your personal website, design your brand identity, create your Electronic Press Kit, sell merch, accept fan support, and access 30+ growth services — all from one dashboard.',
    cta: 'Join Free',
    href: '/sign-up',
  },
  {
    icon: '🏢',
    title: 'For Brands',
    body: 'Find and connect with talent, launch marketing campaigns, manage partnerships, and access our full-service ecosystem of creative, legal, and growth services.',
    cta: 'Join Free',
    href: '/sign-up',
  },
  {
    icon: '📚',
    title: 'Free Resources',
    body: 'Every member gets instant access to our library of free downloadable guides, templates, checklists, and tools — organized for both talent and brands. No upsell required.',
    cta: 'Get Access',
    href: '/sign-up',
  },
]

const FEATURES = [
  {
    icon: '🌐',
    title: 'Personal Website',
    body: 'Your own multi-page website with merch store, fan support, memberships, and more. Launches in under 60 seconds.',
  },
  {
    icon: '🎨',
    title: 'Brand Design',
    body: '20 logo concepts, built-in editor, complete brand package with every file format you need. Delivered instantly.',
  },
  {
    icon: '📋',
    title: 'Electronic Press Kit',
    body: 'Your professional media kit that opens doors to brand deals and media coverage. Auto-built from your profile.',
  },
  {
    icon: '🛍️',
    title: 'Merch & Fan Support',
    body: 'Sell products, accept tips, offer memberships, and reward your supporters with exclusive content and collectibles.',
  },
  {
    icon: '📚',
    title: 'Free Resources',
    body: 'Downloadable guides, templates, and tools for talent and brands. New resources added regularly. Always free.',
  },
  {
    icon: '🗺️',
    title: 'Personalized Roadmap',
    body: 'Tell us your goals and we build a step-by-step plan tailored to your situation. Takes under 2 minutes.',
  },
  {
    icon: '📦',
    title: '30+ Services',
    body: 'From social media management to legal support to podcast setup — browse and purchase services built for your needs.',
  },
  {
    icon: '🧭',
    title: 'Expert Guidance',
    body: 'Not sure where to start? Our Where To Start guide walks you through everything, step by step. No experience needed.',
  },
]

const MEMBERSHIP_PERKS = [
  { title: 'Full service marketplace', body: 'Browse and purchase 30+ professional services' },
  { title: 'Free downloadable resources', body: 'Guides, templates, checklists for talent and brands' },
  { title: 'Personalized roadmap', body: 'A custom action plan based on your goals' },
  { title: 'Dashboard & profile', body: 'Track your products, progress, and activity' },
  { title: 'Expert guidance', body: 'Step-by-step direction no matter your experience level' },
  { title: 'Community access', body: 'Connect with other talent and brands on the platform' },
]

const STEPS = [
  {
    n: 1,
    color: 'hsl(43 49% 45%)',
    title: 'Create Your Account',
    body: "Sign up for free in under a minute. Choose whether you're a talent or a brand.",
  },
  {
    n: 2,
    color: 'hsl(210 70% 55%)',
    title: 'Build Your Profile',
    body: 'Add your info, sport, achievements, and goals. This powers your personalized experience.',
  },
  {
    n: 3,
    color: 'hsl(145 63% 49%)',
    title: 'Explore & Build',
    body: 'Browse services, download free resources, build your roadmap, and start growing.',
  },
  {
    n: 4,
    color: 'hsl(280 50% 60%)',
    title: 'Launch & Earn',
    body: 'Purchase the tools you need — website, brand design, press kit — and start making money.',
  },
]

const FAQ = [
  {
    q: 'Is The Edge Zone really free to join?',
    a: 'Yes — creating an account is 100% free. No credit card, no trial period. You only pay when you choose to purchase a specific service or product.',
  },
  {
    q: 'Who is The Edge Zone for?',
    a: 'Talent (athletes, creators, performers) looking to build their brand and monetize, plus brands looking to find and partner with talent. Education resources are free for everyone.',
  },
  {
    q: 'What services are available?',
    a: 'Brand design, website builder, EPK builder, merch stores, podcast platform, mobile app builder, legal support, marketing campaigns, and 30+ more — all à la carte.',
  },
  {
    q: 'What are the free resources?',
    a: 'Downloadable guides, templates, contract examples, brand checklists, marketing playbooks, and more — added regularly and always free for members.',
  },
  {
    q: 'Do I need any technical skills?',
    a: 'No. Every service is designed to work for people with zero technical background. The platform handles the technical side — you focus on your brand.',
  },
]

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <>
      <MarketingNav />
      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-display text-5xl font-black tracking-tight sm:text-6xl">
                Igniting NIL{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Success.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                The Edge Zone is the all-in-one platform where talent build their brand,
                grow their audience, and turn their name, image, and likeness into real
                income. Everything you need &mdash; in one place, for free.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg">GO TO DASHBOARD →</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-up">
                      <Button size="lg">GET STARTED FREE →</Button>
                    </Link>
                    <Link
                      href="/sign-in"
                      className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      Already a member? <span className="text-primary underline">Log in</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right card — Path to NIL Success */}
            <div className="relative">
              <div className="rounded-[var(--radius)] border border-primary/30 bg-panel p-8 shadow-elevated">
                <p className="text-display text-center text-lg font-black uppercase tracking-wider text-foreground">
                  Discover Your Path to NIL Success
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: '🚀', title: 'Talent', body: 'Elevate your journey, enhance personal brand, unlock opportunities.' },
                    { icon: '🤝', title: 'Brands', body: 'Drive growth, enhance visibility, build meaningful connections.' },
                    { icon: '🎓', title: 'Education', body: 'Tailored solutions, maximize potential, take your journey further.' },
                  ].map((p) => (
                    <div
                      key={p.title}
                      className="rounded-[var(--radius-sm)] border border-primary/50 bg-background/50 p-4 text-center"
                    >
                      <div className="text-3xl">{p.icon}</div>
                      <p className="text-display mt-2 text-sm font-bold uppercase tracking-wider text-foreground">
                        {p.title}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {p.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <section className="border-y border-border bg-panel/40">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-display text-4xl font-black text-primary sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Built For Talent / Brands ────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-display text-4xl font-black tracking-tight sm:text-5xl">
              Built For Talent. Built For Brands.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Whether you&apos;re a talent looking to monetize your name or a brand
              looking to partner with talent &mdash; The Edge Zone has you covered.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {BUILT_FOR.map((card) => (
              <div
                key={card.title}
                className="rounded-[var(--radius)] border border-border bg-panel p-8 shadow-elevated"
              >
                <div className="text-center text-4xl">{card.icon}</div>
                <h3 className="text-display mt-4 text-center text-xl font-bold text-primary">
                  {card.title}
                </h3>
                <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
                <Link
                  href={card.href}
                  className="mt-6 block text-center text-sm font-bold uppercase tracking-widest text-primary hover:text-accent"
                >
                  {card.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Everything You Need To Win ──────────────────────────────── */}
        <section id="services" className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-display text-4xl font-black tracking-tight sm:text-5xl">
              Everything You Need To Win
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              The Edge Zone is packed with tools, services, and resources designed to
              help you build, grow, and profit.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius)] border border-border bg-panel p-6"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="text-display mt-4 text-base font-bold text-primary">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Membership CTA ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-[var(--radius)] border border-border bg-panel p-12 shadow-elevated">
            <p className="text-eyebrow text-center text-primary">Membership</p>
            <h2 className="text-display mt-3 text-center text-4xl font-black tracking-tight">
              Join The Edge Zone &mdash; 100% Free
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Create your free account and instantly unlock access to the full platform.
              No credit card. No trial period. No hidden fees. Just sign up and start
              building.
            </p>
            <div className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {MEMBERSHIP_PERKS.map((perk) => (
                <div key={perk.title} className="flex items-start gap-3">
                  <span className="shrink-0 text-xl leading-none text-success">✓</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{perk.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {perk.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href={user ? '/dashboard' : '/sign-up'}>
                <Button size="lg">
                  {user ? 'GO TO DASHBOARD →' : 'CREATE YOUR FREE ACCOUNT →'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────── */}
        <section id="how" className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-display text-center text-4xl font-black tracking-tight sm:text-5xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-[var(--radius)] border border-border bg-panel p-6 text-center"
              >
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-display text-xl font-black text-background"
                  style={{ backgroundColor: step.color }}
                >
                  {step.n}
                </div>
                <h3 className="text-display mt-4 text-base font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-display text-center text-4xl font-black tracking-tight sm:text-5xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10">
            <Faq items={FAQ} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
