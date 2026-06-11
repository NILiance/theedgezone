import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: 'Free Resources' }

const CATEGORIES = [
  { icon: '📚', title: 'Guides', body: 'Step-by-step playbooks for talent and brands' },
  { icon: '📋', title: 'Templates', body: 'Contract examples, brand kit templates, intake forms' },
  { icon: '✅', title: 'Checklists', body: 'Launch checklists, compliance checklists, prep lists' },
  { icon: '🛠️', title: 'Tools', body: 'Calculators, planners, branding worksheets' },
]

export default async function ResourcesPage() {
  const user = await getCurrentUser()

  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-eyebrow text-accent">Free Resources</p>
          <h1 className="text-display mt-3 text-5xl font-black uppercase tracking-tight sm:text-6xl">
            Everything You Need.{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Always Free.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Create your free account to access our full library of downloadable guides,
            templates, and tools. New resources added regularly. No upsell required.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.title}
                className="rounded-[var(--radius)] border border-border bg-panel p-6 text-center"
              >
                <div className="text-3xl">{cat.icon}</div>
                <h3 className="text-display mt-4 text-base font-bold text-primary">
                  {cat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cat.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
          <div className="rounded-[var(--radius)] border border-primary/40 bg-panel/60 p-12 shadow-elevated">
            {user ? (
              <>
                <h2 className="text-display text-3xl font-black tracking-tight">
                  Browse Resources
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  Head to your dashboard to access the full library.
                </p>
                <div className="mt-8">
                  <Link href="/dashboard">
                    <Button size="lg">GO TO DASHBOARD →</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-display text-3xl font-black tracking-tight">
                  Unlock the full library
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  100% free. No credit card. No trial. Just sign up.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/sign-up">
                    <Button size="lg">CREATE FREE ACCOUNT →</Button>
                  </Link>
                  <Link
                    href="/sign-in"
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    Already a member? <span className="text-primary underline">Log in</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
