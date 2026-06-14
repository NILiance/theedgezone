import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Opportunities' }

interface PageProps {
  searchParams: Promise<{ category?: string; audience?: string }>
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const user = await getCurrentUser()
  const supabase = await createClient()

  let query = supabase
    .from('opportunities')
    .select('id, title, description, category, audience, price_cents, currency, location, deadline_at, contact_email, external_url, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(60)

  if (sp.category) query = query.eq('category', sp.category)
  if (sp.audience) query = query.eq('audience', sp.audience)

  const { data: opportunities } = await query

  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow text-accent">Opportunities</p>
              <h1 className="text-display mt-3 text-4xl font-black uppercase tracking-tight sm:text-5xl">
                Brand deals & opportunities
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Brand campaigns, single & bulk jobs, subscription boxes, perks, and rewards —
                synced from{' '}
                <Link href="/about" className="text-primary hover:underline">
                  NILiance
                </Link>
                .
              </p>
            </div>
            {user ? (
              <Link href="/dashboard/opportunities/new">
                <Button>Post an opportunity</Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button>Sign up to post</Button>
              </Link>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <FilterPill label="All" href="/opportunities" active={!sp.audience} />
            <FilterPill
              label="For talent"
              href="/opportunities?audience=talent"
              active={sp.audience === 'talent'}
            />
            <FilterPill
              label="For brands"
              href="/opportunities?audience=brand"
              active={sp.audience === 'brand'}
            />
            <FilterPill
              label="Open to all"
              href="/opportunities?audience=everyone"
              active={sp.audience === 'everyone'}
            />
          </div>

          {(opportunities ?? []).length === 0 ? (
            <div className="mt-12 rounded-[var(--radius)] border border-border bg-panel/40 p-12 text-center">
              <p className="text-display text-lg font-bold">No opportunities posted yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {user
                  ? 'Be the first — post one above.'
                  : 'Sign up to post the first one or get notified when brands list something.'}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(opportunities ?? []).map((o) => (
                <article
                  key={o.id}
                  className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    {o.category && (
                      <p className="text-eyebrow text-primary">{o.category}</p>
                    )}
                    {o.price_cents != null && o.price_cents > 0 && (
                      <p className="text-display text-lg font-black text-primary">
                        ${(o.price_cents / 100).toFixed(0)}
                      </p>
                    )}
                  </div>
                  <h3 className="text-display text-base font-bold">{o.title}</h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{o.description}</p>
                  <div className="mt-auto flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {o.location && <span>📍 {o.location}</span>}
                    {o.deadline_at && (
                      <span>Closes {new Date(o.deadline_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3 text-xs">
                    {o.external_url ? (
                      <a
                        href={o.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View details →
                      </a>
                    ) : o.contact_email ? (
                      <a
                        href={`mailto:${o.contact_email}`}
                        className="text-primary hover:underline"
                      >
                        Reach out →
                      </a>
                    ) : (
                      <Link href={`/opportunities/${o.id}`} className="text-primary hover:underline">
                        Details →
                      </Link>
                    )}
                  </div>
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

function FilterPill({
  label,
  href,
  active,
}: {
  label: string
  href: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`text-display rounded-full px-3 py-1.5 font-bold uppercase tracking-widest transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-panel-elevated/50 text-muted-foreground hover:bg-panel'
      }`}
    >
      {label}
    </Link>
  )
}
