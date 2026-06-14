import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Free Resources' }

interface PageProps {
  searchParams: Promise<{ audience?: string; category?: string }>
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const user = await getCurrentUser()
  const supabase = await createClient()

  const audienceFilter = sp.audience && ['talent', 'brand', 'all'].includes(sp.audience)
    ? sp.audience
    : null

  // Categories
  const { data: categories } = await supabase
    .from('resource_categories')
    .select('id, slug, name, description, icon, position')
    .order('position', { ascending: true })

  // Resources — filter to audience='all' or matching the chip if set
  let resourcesQuery = supabase
    .from('resources')
    .select(
      'id, slug, title, description, audience, category_id, file_url, thumbnail_url, external_url, featured, download_count, view_count'
    )
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (audienceFilter) {
    resourcesQuery = resourcesQuery.in('audience', [audienceFilter, 'all'])
  }
  if (sp.category) {
    const cat = (categories ?? []).find((c) => c.slug === sp.category)
    if (cat) resourcesQuery = resourcesQuery.eq('category_id', cat.id)
  }

  const { data: resources } = await resourcesQuery

  const categoriesById = new Map((categories ?? []).map((c) => [c.id, c]))

  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-eyebrow text-accent">Free Resources</p>
          <h1 className="text-display mt-3 text-5xl font-black uppercase tracking-tight sm:text-6xl">
            Everything you need.{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Always free.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Playbooks, templates, checklists, tools. Browse below — no sign-up required for the
            free tier. Create an account for member-only resources.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill label="All audiences" href="/resources" active={!sp.audience} />
            <FilterPill label="For talent" href="/resources?audience=talent" active={sp.audience === 'talent'} />
            <FilterPill label="For brands" href="/resources?audience=brand" active={sp.audience === 'brand'} />
            <span className="ml-3 text-xs text-muted-foreground">Category:</span>
            <FilterPill label="All" href="/resources" active={!sp.category} />
            {(categories ?? []).map((c) => (
              <FilterPill
                key={c.id}
                label={`${c.icon ?? ''} ${c.name}`.trim()}
                href={`/resources?category=${c.slug}`}
                active={sp.category === c.slug}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          {(resources ?? []).length === 0 ? (
            <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-12 text-center">
              <p className="text-display text-lg font-bold">Nothing here yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;re adding resources weekly. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(resources ?? []).map((r) => {
                const cat = r.category_id ? categoriesById.get(r.category_id) : null
                return (
                  <article
                    key={r.id}
                    className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-eyebrow text-primary">
                        {cat ? `${cat.icon ?? ''} ${cat.name}` : 'Resource'}
                      </p>
                      {r.featured && (
                        <span className="text-display rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="text-display text-base font-bold">{r.title}</h3>
                    {r.description && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-border pt-3">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {r.audience === 'all' ? 'Everyone' : r.audience === 'talent' ? 'Talent' : 'Brands'}
                        {r.download_count > 0 && ` · ${r.download_count.toLocaleString()} downloads`}
                      </span>
                      <a
                        href={`/api/resources/${r.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Download →
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
          <div className="rounded-[var(--radius)] border border-primary/40 bg-panel/60 p-12 shadow-elevated">
            {user ? (
              <>
                <h2 className="text-display text-3xl font-black tracking-tight">
                  Get the full toolkit
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  Member-only resources, premium services, and personal templates all live in
                  your dashboard.
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
                  Member-only resources
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  Create a free account to unlock the rest of the library.
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
      className={`text-display rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-panel-elevated/50 text-muted-foreground hover:bg-panel'
      }`}
    >
      {label}
    </Link>
  )
}
