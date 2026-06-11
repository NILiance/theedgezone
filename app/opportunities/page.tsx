import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: 'Opportunities' }

export default async function OpportunitiesPage() {
  const user = await getCurrentUser()

  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-eyebrow text-accent">Opportunities</p>
          <h1 className="text-display mt-3 text-5xl font-black uppercase tracking-tight sm:text-6xl">
            Brand Deals &amp;{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Opportunities.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Browse free brand-offered opportunities exclusively available to qualified talent
            &mdash; campaigns, single and bulk jobs, subscription boxes, perks, and rewards.
            Plus set up your own offerings to monetize your name, image, and likeness.
          </p>
          <div className="mt-10">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg">GO TO DASHBOARD →</Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button size="lg">SIGN UP TO BROWSE OPPORTUNITIES →</Button>
              </Link>
            )}
          </div>
          <p className="mt-12 text-sm text-muted-foreground">
            Powered by{' '}
            <Link href="/about" className="text-primary hover:underline">
              NILiance
            </Link>{' '}
            &mdash; our NIL marketplace.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
