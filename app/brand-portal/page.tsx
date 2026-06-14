import Link from 'next/link'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { createServiceClient } from '@/lib/supabase/server'
import { getBrandClientSession } from '@/lib/brand-client-auth'
import { Button } from '@/components/ui/button'
import { LogoutForm } from './logout-form'

export const metadata = { title: 'Brand portal' }

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function BrandPortalPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const session = await getBrandClientSession()

  if (!session) {
    return (
      <>
        <MarketingNav />
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-display text-3xl font-black tracking-tight">Brand portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Brand customers access this portal via a magic link sent by the team.
          </p>
          {sp.error === 'invalid' && (
            <p className="mt-6 rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              That link is invalid. Ask the team to resend.
            </p>
          )}
          {sp.error === 'expired' && (
            <p className="mt-6 rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-3 text-sm text-accent">
              That link expired. Ask the team to send a new one.
            </p>
          )}
          {!sp.error && (
            <p className="mt-6 rounded-[var(--radius-sm)] border border-border bg-panel/40 p-3 text-sm text-muted-foreground">
              Check your inbox for the access link.
            </p>
          )}
          <p className="mt-6 text-xs text-muted-foreground">
            Are you a talent? Sign in at{' '}
            <Link href="/sign-in" className="text-primary hover:underline">
              /sign-in
            </Link>{' '}
            instead.
          </p>
        </main>
        <Footer />
      </>
    )
  }

  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <>
        <MarketingNav />
        <main className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-sm text-destructive">Server misconfiguration — please try again later.</p>
        </main>
        <Footer />
      </>
    )
  }

  const { data: assets } = await supabase
    .from('brand_client_assets')
    .select('id, kind, filename, url, size_bytes, description, created_at')
    .eq('brand_client_id', session.brandClientId)
    .order('created_at', { ascending: false })

  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-accent">Brand portal</p>
            <h1 className="text-display mt-2 text-3xl font-black tracking-tight">
              Welcome, {session.name}
            </h1>
            {session.company && (
              <p className="mt-1 text-sm text-muted-foreground">{session.company}</p>
            )}
          </div>
          <LogoutForm />
        </div>

        <section className="mt-8 rounded-[var(--radius)] border border-border bg-panel/40 p-6">
          <p className="text-eyebrow text-primary">Your assets</p>
          {(assets ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No assets yet. We&apos;ll drop deliverables here as they&apos;re ready.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {(assets ?? []).map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-baseline justify-between gap-3 rounded-[var(--radius-sm)] border border-border bg-background px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-display font-bold">{a.filename}</p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    )}
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {a.kind}
                      {a.size_bytes && ` · ${(a.size_bytes / 1024).toFixed(0)} KB`}
                      {' · '}
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" download>
                    <Button size="sm" variant="outline">
                      Download
                    </Button>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-[var(--radius)] border border-border bg-panel/40 p-6">
          <p className="text-eyebrow text-primary">Need a revision?</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Email us at{' '}
            <a href="mailto:hello@theedgezone.com" className="text-primary hover:underline">
              hello@theedgezone.com
            </a>{' '}
            with what you&apos;d like changed and we&apos;ll get back within a business day.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
