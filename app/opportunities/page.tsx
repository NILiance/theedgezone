import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { getUserContext } from '@/lib/auth'
import { listBrandOpportunities } from '@/lib/opportunities'
import { OpportunityFilters } from './opportunity-filters'

export const metadata = { title: 'Opportunities' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { user, userType, isAdmin } = await getUserContext()

  // Login-gated. Guests → sign in (legacy bounces to login).
  if (!user) redirect('/sign-in?next=/opportunities')

  // Talent-only. Brands and any other role get the denial page (admins bypass).
  if (userType !== 'talent' && !isAdmin) {
    return (
      <>
        <MarketingNav />
        <main className="mx-auto max-w-2xl px-6 py-24 text-center">
          <p className="text-eyebrow text-accent">Talent accounts only</p>
          <h1 className="text-display mt-3 text-3xl font-black">This page is for talent</h1>
          <p className="mt-3 text-muted-foreground">
            Opportunities are where talent discover brand-offered campaigns and gigs. If you&rsquo;re
            a brand, head to the{' '}
            <Link href="/dashboard/talent-directory" className="text-primary hover:underline">
              Talent Directory
            </Link>{' '}
            to find talent, or post an opportunity on NILiance.
          </p>
          <Link
            href="/dashboard"
            className="text-display mt-6 inline-block rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Back to dashboard
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  const opportunities = await listBrandOpportunities({
    keywords: sp.q?.trim() || undefined,
    category: sp.category || undefined,
  })

  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-eyebrow text-accent">Opportunities</p>
          <h1 className="text-display mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
            Opportunities
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Brand campaigns, paid appearances, and gigs available right now.
          </p>

          <OpportunityFilters q={sp.q ?? ''} category={sp.category ?? ''} />

          {opportunities.length === 0 ? (
            <div className="mt-10 rounded-[var(--radius)] border border-border bg-panel/40 p-12 text-center">
              <p className="text-display text-lg font-bold">No opportunities match.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon — new brand offers sync from NILiance regularly.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((o) => (
                <article
                  key={o.uuid}
                  className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-display rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      {o.categoryLabel}
                    </span>
                    <span className="text-right">
                      {o.price && o.price.amount > 0 ? (
                        <span className="text-display text-lg font-black text-primary">
                          ${Math.round(o.price.amount / 100)}
                        </span>
                      ) : (
                        <span className="text-display text-[10px] font-bold uppercase leading-tight tracking-widest text-primary">
                          Free Exclusive
                          <br />
                          Offer for
                          <br />
                          Qualified Talent
                        </span>
                      )}
                    </span>
                  </div>
                  <h3 className="text-display text-base font-bold">{o.title}</h3>
                  {o.description && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {o.description.length > 180
                        ? `${o.description.slice(0, 180)}…`
                        : o.description}
                    </p>
                  )}
                  {o.nilianceUrl && (
                    <a
                      href={o.nilianceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-display mt-auto inline-block rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-primary-foreground"
                    >
                      View on NILiance →
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
