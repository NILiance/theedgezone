import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Faq } from '@/components/landing/faq'
import { ServicePricingCard } from '@/components/landing/service-pricing-card'
import { Button } from '@/components/ui/button'
import { CATEGORIES, SERVICES, type Service } from '@/lib/services-data'
import { getServiceContent, type PricingTier } from '@/lib/services-rich-content'
import { getCurrentUser } from '@/lib/auth'
import { getServicePricing, pricingLabel } from '@/lib/service-pricing'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.id }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const service = SERVICES.find((s) => s.id === slug)
  if (!service) return { title: 'Service Not Found' }
  return {
    title: service.title,
    description: service.tagline,
  }
}

/** Derive a sane pricing-tier array from the service's `price` string. */
function inferTiersFromPrice(price: string): PricingTier[] {
  if (!price || price.toLowerCase().includes('free') || price.toLowerCase().includes('custom')) {
    return []
  }
  // e.g. "$29/mo" → monthly + computed annual @ 20% off
  const monthlyMatch = price.match(/^\$([\d.,]+)\/mo$/)
  if (monthlyMatch) {
    const monthly = parseFloat(monthlyMatch[1]!.replace(/,/g, ''))
    const annualPerMonth = (monthly * 0.8).toFixed(2)
    return [
      { label: 'Monthly', amount: `$${monthly}`, period: 'per month' },
      {
        label: 'Annual',
        amount: `$${annualPerMonth}`,
        period: 'per month, billed annually',
        savings: 'Save 20%',
      },
    ]
  }
  // e.g. "$499" → one-time only
  return [{ label: 'One-time', amount: price, period: 'one-time payment' }]
}

function buildTiersFromOverride(
  override: { plan_monthly_cents: number | null; plan_annual_cents: number | null; plan_onetime_cents: number | null },
  contentTiers?: PricingTier[]
): PricingTier[] {
  const out: PricingTier[] = []
  if (override.plan_monthly_cents != null && override.plan_monthly_cents > 0) {
    out.push({
      label: 'Monthly',
      amount: `$${(override.plan_monthly_cents / 100).toFixed(0)}`,
      period: 'per month',
    })
  }
  if (override.plan_annual_cents != null && override.plan_annual_cents > 0) {
    const perMonth = (override.plan_annual_cents / 12 / 100).toFixed(2)
    out.push({
      label: 'Annual',
      amount: `$${perMonth}`,
      period: 'per month, billed annually',
    })
  }
  if (override.plan_onetime_cents != null && override.plan_onetime_cents > 0) {
    out.push({
      label: 'One-time',
      amount: `$${(override.plan_onetime_cents / 100).toFixed(0)}`,
      period: 'one-time payment',
    })
  }
  return out.length > 0 ? out : contentTiers ?? []
}

function defaultStats(service: Service) {
  const baseStats = [
    { value: service.autoCreated ? '✓' : '—', label: 'Auto-Created' },
    { value: '500+', label: 'Talent Active' },
    { value: '96%', label: 'Satisfaction' },
    { value: 'Instant', label: 'Setup' },
  ]
  return baseStats
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const service = SERVICES.find((s) => s.id === slug)
  if (!service) notFound()

  const content = getServiceContent(slug)
  const category = CATEGORIES.find((c) => c.key === service.category)
  const related = SERVICES.filter(
    (s) => s.category === service.category && s.id !== slug
  ).slice(0, 3)

  const pricingOverride = await getServicePricing(slug)
  const tiers = pricingOverride
    ? buildTiersFromOverride(pricingOverride, content?.pricing)
    : content?.pricing ?? inferTiersFromPrice(service.price)
  const displayedFallback = pricingOverride
    ? pricingLabel(pricingOverride, service.price)
    : service.price
  const stats = content?.stats ?? defaultStats(service)
  const user = await getCurrentUser()

  return (
    <>
      <MarketingNav />
      <main>
        {/* ── Breadcrumb ───────────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-6 pt-8 text-sm text-muted-foreground">
          <Link href="/services" className="hover:text-foreground">
            Services
          </Link>
          {category && (
            <>
              <span className="mx-2 text-foreground/40">/</span>
              <Link href="/services" className="hover:text-foreground">
                {category.label}
              </Link>
            </>
          )}
          <span className="mx-2 text-foreground/40">/</span>
          <span className="text-foreground">{service.title}</span>
        </div>

        {/* ── Hero + Pricing ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-eyebrow text-accent">{category?.label}</p>
              <h1 className="text-display mt-3 text-4xl font-black uppercase tracking-tight sm:text-5xl">
                {service.title}
              </h1>
              <p className="mt-4 text-lg text-foreground/90">{service.tagline}</p>
              <p className="mt-4 text-muted-foreground">{service.description}</p>

              {content?.intro && (
                <div className="mt-10">
                  <p className="text-eyebrow text-primary">What&apos;s Included</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{content.intro}</p>
                </div>
              )}

              {/* Stat tiles */}
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-[var(--radius-sm)] border border-border bg-panel/60 p-4 text-center"
                  >
                    <p className="text-display text-2xl font-black text-primary">{s.value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside>
              <ServicePricingCard
                slug={slug}
                tiers={tiers}
                ctaLabel={content?.ctaLabel ?? 'GET STARTED →'}
                fallbackPrice={displayedFallback}
                authed={!!user}
              />
            </aside>
          </div>
        </section>

        {/* ── Punch section + feature cards ───────────────────────────── */}
        {(content?.punchTitle || content?.featureCards) && (
          <section className="mx-auto max-w-6xl px-6 py-16 text-center">
            {content.punchTitle && (
              <h2 className="text-display text-4xl font-black tracking-tight sm:text-5xl">
                {content.punchTitle}
              </h2>
            )}
            {content.punchSub && (
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{content.punchSub}</p>
            )}
            {content.featureCards && (
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {content.featureCards.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-[var(--radius)] border border-border bg-panel p-8 text-left shadow-elevated"
                  >
                    <h3 className="text-display text-xl font-bold text-primary">{f.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Everything That Comes With (includes sections) ──────────── */}
        {content?.includes && (
          <section className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="text-display text-center text-3xl font-black tracking-tight sm:text-4xl">
              Everything That Comes With {service.title}
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {content.includes.map((section) => (
                <div
                  key={section.title}
                  className="rounded-[var(--radius)] border border-border bg-panel p-6"
                >
                  <h3 className="text-display text-base font-bold text-primary">
                    {section.title}
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="shrink-0 text-primary">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 4-step process ──────────────────────────────────────────── */}
        {content?.steps && (
          <section className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-display text-center text-3xl font-black tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {content.steps.map((step) => (
                <div
                  key={step.n}
                  className="rounded-[var(--radius)] border border-border bg-panel p-6 text-center"
                >
                  <div className="text-display mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-black text-primary-foreground">
                    {step.n}
                  </div>
                  <h3 className="text-display mt-4 text-base font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        {content?.faq && content.faq.length > 0 && (
          <section className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="text-display text-center text-3xl font-black tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-10">
              <Faq items={content.faq} />
            </div>
          </section>
        )}

        {/* ── Related services ───────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-eyebrow text-foreground/70">You Might Also Like</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/services/${r.id}`}
                  className="group rounded-[var(--radius)] border border-border bg-panel p-6 transition-colors hover:border-primary/40"
                >
                  <div className="text-3xl">{r.icon}</div>
                  <h3 className="text-display mt-3 text-base font-bold text-foreground group-hover:text-primary">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{r.tagline}</p>
                  <p className="text-display mt-4 text-sm font-bold text-primary">{r.price}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Final CTA ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="rounded-[var(--radius)] border border-primary/40 bg-panel/60 p-10 shadow-elevated">
            <h2 className="text-display text-3xl font-black tracking-tight">
              Ready to get started?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Join hundreds of talent and brands already growing with The Edge Zone.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/sign-up">
                <Button size="lg">{content?.ctaLabel ?? 'GET STARTED FREE →'}</Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline">
                  BROWSE ALL SERVICES
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
