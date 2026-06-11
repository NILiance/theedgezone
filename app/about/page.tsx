import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'About NILiance' }

const PILLARS = [
  {
    icon: '🤝',
    title: 'Connect',
    body:
      'The NILiance marketplace links qualified talent with brands looking for authentic partnerships.',
  },
  {
    icon: '⚡',
    title: 'Power',
    body:
      'Every Edge Zone tool — sites, EPKs, stores, apps, podcasts — is powered by NILiance under the hood.',
  },
  {
    icon: '🛡️',
    title: 'Protect',
    body:
      'Built-in compliance, contracts, and protection so NIL deals stay clean and athletes stay eligible.',
  },
]

export default function AboutPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-eyebrow text-accent">About NILiance</p>
          <h1 className="text-display mt-3 text-5xl font-black uppercase tracking-tight sm:text-6xl">
            One Family.{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              One Mission.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            The Edge Zone is part of the NILiance family &mdash; an end-to-end NIL ecosystem
            connecting talent, brands, and education. NILiance is our marketplace; Edge Zone
            is your toolkit.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-[var(--radius)] border border-border bg-panel p-8 text-center shadow-elevated"
              >
                <div className="text-4xl">{p.icon}</div>
                <h3 className="text-display mt-4 text-xl font-bold text-primary">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
          <div className="rounded-[var(--radius)] border border-primary/40 bg-panel/60 p-12 shadow-elevated">
            <p className="text-eyebrow text-primary">Part of the NIL Innovations Family</p>
            <h2 className="text-display mt-3 text-3xl font-black tracking-tight">
              Ready to be part of the movement?
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/sign-up">
                <Button size="lg">CREATE YOUR FREE ACCOUNT →</Button>
              </Link>
              <Link href="/opportunities">
                <Button size="lg" variant="outline">
                  BROWSE OPPORTUNITIES
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
