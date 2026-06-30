import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

/**
 * Dedicated product sales pages served at the root of each product domain
 * (mytalentsite.com, talentepk.com, podcastfortalent.com, nilstores.com,
 * appsfortalent.com — see middleware). CTA → sign-up on the main app domain so
 * auth stays centralized.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.com'

interface Landing {
  product: string
  domain: string
  eyebrow: string
  headline: string
  sub: string
  features: { title: string; body: string }[]
  cta: string
}

const LANDINGS: Record<string, Landing> = {
  sites: {
    product: 'sites',
    domain: 'mytalentsite.com',
    eyebrow: 'Talent Websites',
    headline: 'Your pro website, live in minutes.',
    sub: 'A drag-and-drop website built for athletes and creators — your bio, stats, highlights, sponsors, and booking, all on your own domain.',
    features: [
      { title: 'Drag-and-drop builder', body: 'Pick a template, drop in blocks, publish. No code, no designer.' },
      { title: 'Your own domain', body: 'yourname.mytalentsite.com — or connect a custom domain you own.' },
      { title: 'Built to convert', body: 'Booking, sponsorships, fan signups, and a store, baked right in.' },
    ],
    cta: 'Build my website',
  },
  epk: {
    product: 'epk',
    domain: 'talentepk.com',
    eyebrow: 'Press Kits',
    headline: 'The press kit brands and agents ask for.',
    sub: 'A polished electronic press kit — bio, stats, media, social reach, and contact — that you send with a single link.',
    features: [
      { title: 'One link, fully branded', body: 'yourname.talentepk.com, ready to send to brands and media.' },
      { title: 'Auto-built from your profile', body: 'Stats, highlights, and socials pulled in for you.' },
      { title: 'PDF + QR included', body: 'Download a print-ready kit and a scannable code.' },
    ],
    cta: 'Create my press kit',
  },
  podcast: {
    product: 'podcast',
    domain: 'podcastfortalent.com',
    eyebrow: 'Podcasts',
    headline: 'Launch your podcast. Own your audience.',
    sub: 'Host episodes, get a real RSS feed for Apple and Spotify, and sell premium subscriptions — all under your name.',
    features: [
      { title: 'Real RSS feed', body: 'Submit to Apple Podcasts, Spotify, and everywhere else.' },
      { title: 'Premium subscriptions', body: 'Gate bonus episodes behind a paid private feed.' },
      { title: 'Your own page', body: 'yourname.podcastfortalent.com with player and episode list.' },
    ],
    cta: 'Start my podcast',
  },
  stores: {
    product: 'stores',
    domain: 'nilstores.com',
    eyebrow: 'Merch Stores',
    headline: 'Sell your merch. Keep the margin.',
    sub: 'A branded store with print-on-demand and wholesale products, secure checkout, and automatic fulfillment — you set the prices.',
    features: [
      { title: 'Print-on-demand', body: 'Drop your logo on apparel and we generate live mockups.' },
      { title: 'Hands-off fulfillment', body: 'Orders ship automatically. You keep the profit.' },
      { title: 'Designer storefront', body: 'yourname.nilstores.com, styled to your brand with custom sections.' },
    ],
    cta: 'Open my store',
  },
  apps: {
    product: 'apps',
    domain: 'appsfortalent.com',
    eyebrow: 'Mobile Apps',
    headline: 'Your own mobile app.',
    sub: 'A branded app your fans install to their home screen — content, store, links, and push notifications, with no app-store hassle.',
    features: [
      { title: 'Installable in one tap', body: 'Fans add it to their home screen — it opens full-screen like a native app.' },
      { title: 'Push notifications', body: 'Reach your audience directly, any time.' },
      { title: 'Your content + store', body: 'yourname.appsfortalent.com, fully branded.' },
    ],
    cta: 'Build my app',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>
}): Promise<Metadata> {
  const { product } = await params
  const lp = LANDINGS[product]
  if (!lp) return { title: 'Edge Zone' }
  return { title: `${lp.eyebrow} — ${lp.domain}`, description: lp.sub }
}

export default async function ProductLandingPage({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product } = await params
  const lp = LANDINGS[product]
  if (!lp) notFound()
  const signUp = `${SITE}/sign-up?ref=${lp.product}`

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-display text-sm font-black uppercase tracking-widest">{lp.domain}</span>
        <a
          href={`${SITE}/sign-in`}
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Sign in
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
        <p className="text-eyebrow text-primary">{lp.eyebrow}</p>
        <h1 className="text-display mt-3 text-5xl font-black tracking-tight sm:text-6xl">
          {lp.headline}
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">{lp.sub}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href={signUp}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
          >
            {lp.cta} →
          </a>
          <a
            href={`${SITE}/services`}
            className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-panel"
          >
            See pricing
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-panel/30 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
          {lp.features.map((f) => (
            <div
              key={f.title}
              className="rounded-[var(--radius)] border border-border bg-background/40 p-6"
            >
              <p className="text-display text-lg font-black">{f.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h2 className="text-display text-3xl font-black tracking-tight">Ready when you are.</h2>
        <p className="mt-3 text-muted-foreground">
          Set it up in minutes — start free, publish on {lp.domain}.
        </p>
        <a
          href={signUp}
          className="text-display mt-7 inline-block rounded-[var(--radius-sm)] bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
        >
          {lp.cta} →
        </a>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        Powered by{' '}
        <a href={SITE} className="text-primary hover:underline">
          Edge Zone
        </a>
      </footer>
    </main>
  )
}
