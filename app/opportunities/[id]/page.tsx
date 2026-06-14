import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, description, category, audience, price_cents, currency, location, deadline_at, contact_email, external_url, created_at')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!opportunity) notFound()

  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/opportunities"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← All opportunities
        </Link>
        <div className="mt-6">
          {opportunity.category && (
            <p className="text-eyebrow text-primary">{opportunity.category}</p>
          )}
          <h1 className="text-display mt-3 text-4xl font-black tracking-tight">
            {opportunity.title}
          </h1>
          {opportunity.price_cents != null && opportunity.price_cents > 0 && (
            <p className="text-display mt-3 text-3xl font-black text-primary">
              ${(opportunity.price_cents / 100).toFixed(0)}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {(opportunity.currency ?? 'usd').toUpperCase()}
              </span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {opportunity.location && <span>📍 {opportunity.location}</span>}
            {opportunity.deadline_at && (
              <span>Closes {new Date(opportunity.deadline_at).toLocaleDateString()}</span>
            )}
            <span>Posted {new Date(opportunity.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="mt-8 whitespace-pre-line leading-relaxed text-foreground/90">
          {opportunity.description}
        </div>
        <div className="mt-10 border-t border-border pt-6">
          {opportunity.external_url ? (
            <a href={opportunity.external_url} target="_blank" rel="noopener noreferrer">
              <Button size="lg">Apply / view details →</Button>
            </a>
          ) : opportunity.contact_email ? (
            <a href={`mailto:${opportunity.contact_email}?subject=Re: ${opportunity.title}`}>
              <Button size="lg">Email to apply →</Button>
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No contact info provided.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
