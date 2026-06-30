import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  Globe,
  LayoutTemplate,
  Sparkles,
  Share2,
  Calendar,
  ShoppingBag,
  BarChart3,
  FileText,
  QrCode,
  Users,
  Mic,
  Rss,
  CreditCard,
  Lock,
  Smartphone,
  Bell,
  Palette,
  Truck,
  Zap,
  Check,
  ArrowRight,
  Star,
  type LucideIcon,
} from 'lucide-react'

/**
 * Dedicated product sales pages served at the root of each product domain
 * (see middleware). CTA → sign-up on the main app domain so auth stays
 * centralized. Rich layout: hero visual, stat bar, feature grid, steps, FAQ.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.com'

interface Feature {
  Icon: LucideIcon
  title: string
  body: string
}
interface Landing {
  product: string
  domain: string
  eyebrow: string
  headline: string
  sub: string
  Icon: LucideIcon
  hue: string
  chrome: 'browser' | 'phone'
  stats: { value: string; label: string }[]
  features: Feature[]
  steps: { title: string; body: string }[]
  faqs: { q: string; a: string }[]
  cta: string
}

const LANDINGS: Record<string, Landing> = {
  sites: {
    product: 'sites',
    domain: 'mytalentsite.com',
    eyebrow: 'Talent Websites',
    headline: 'Your pro website, live in minutes.',
    sub: 'A drag-and-drop website built for athletes and creators — bio, stats, highlights, sponsors, bookings, and a store, all on your own domain.',
    Icon: Globe,
    hue: '#3B82F6',
    chrome: 'browser',
    stats: [
      { value: '5 min', label: 'to publish' },
      { value: '100+', label: 'blocks & templates' },
      { value: '0', label: 'code required' },
    ],
    features: [
      { Icon: LayoutTemplate, title: 'Drag-and-drop builder', body: 'Start from a template, drop in blocks, publish. No designer needed.' },
      { Icon: Globe, title: 'Your own domain', body: 'yourname.mytalentsite.com — or connect a custom domain you own.' },
      { Icon: Calendar, title: 'Bookings built in', body: 'Take appearance, coaching, and sponsorship requests on your site.' },
      { Icon: ShoppingBag, title: 'Sell & monetize', body: 'Merch, memberships, tips, and sponsor placements out of the box.' },
      { Icon: Share2, title: 'Socials & highlights', body: 'Pull in your reels, social feeds, and stats automatically.' },
      { Icon: BarChart3, title: 'Built-in analytics', body: 'See visitors, clicks, and exactly what’s converting.' },
    ],
    steps: [
      { title: 'Pick a template', body: 'Choose a layout designed for athletes and creators.' },
      { title: 'Drop in your content', body: 'Edit text, photos, stats, and links inline.' },
      { title: 'Publish to your domain', body: 'Go live on mytalentsite.com instantly.' },
    ],
    faqs: [
      { q: 'Do I need a domain?', a: 'No — you get yourname.mytalentsite.com free. You can also connect a custom domain anytime.' },
      { q: 'Can I change it later?', a: 'Yes. Edit and republish whenever you want — changes are live in seconds.' },
      { q: 'Can I sell from my site?', a: 'Absolutely — add a store, memberships, tips, and more.' },
      { q: 'How long does it take?', a: 'Most people publish a great-looking site in well under an hour.' },
    ],
    cta: 'Build my website',
  },
  epk: {
    product: 'epk',
    domain: 'talentepk.com',
    eyebrow: 'Press Kits',
    headline: 'The press kit brands and agents ask for.',
    sub: 'A polished electronic press kit — bio, stats, media, social reach, and contact — that you send with a single link.',
    Icon: FileText,
    hue: '#8B5CF6',
    chrome: 'browser',
    stats: [
      { value: '1 link', label: 'send anywhere' },
      { value: 'PDF + QR', label: 'included' },
      { value: 'Auto', label: 'from your profile' },
    ],
    features: [
      { Icon: Sparkles, title: 'Auto-built', body: 'Bio, stats, and highlights pulled straight from your profile.' },
      { Icon: Share2, title: 'One shareable link', body: 'yourname.talentepk.com — ready for brands and media.' },
      { Icon: FileText, title: 'Print-ready PDF', body: 'Download a polished press-kit PDF whenever you need it.' },
      { Icon: QrCode, title: 'Scannable QR', body: 'Drop your code on flyers, cards, and screens.' },
      { Icon: BarChart3, title: 'Social proof', body: 'Followers, reach, and engagement front and center.' },
      { Icon: Lock, title: 'Always current', body: 'Update once — every link you’ve shared stays up to date.' },
    ],
    steps: [
      { title: 'Connect your profile', body: 'We pull in stats, media, and socials for you.' },
      { title: 'Pick a template', body: 'Classic, media-forward, or stats-forward layouts.' },
      { title: 'Share your link', body: 'Send one link or hand out the QR code.' },
    ],
    faqs: [
      { q: 'What’s an EPK?', a: 'An electronic press kit — the one-link profile brands, agents, and media use to evaluate you.' },
      { q: 'Can I download a PDF?', a: 'Yes — a print-ready PDF and a QR code are included.' },
      { q: 'Does it update automatically?', a: 'Edit anytime; your shared link and PDF reflect the latest.' },
      { q: 'Is it really one link?', a: 'Yes — yourname.talentepk.com is all you send.' },
    ],
    cta: 'Create my press kit',
  },
  podcast: {
    product: 'podcast',
    domain: 'podcastfortalent.com',
    eyebrow: 'Podcasts',
    headline: 'Launch your podcast. Own your audience.',
    sub: 'Host episodes, get a real RSS feed for Apple and Spotify, and sell premium subscriptions — all under your name.',
    Icon: Mic,
    hue: '#EC4899',
    chrome: 'phone',
    stats: [
      { value: 'Apple', label: '+ Spotify ready' },
      { value: 'Premium', label: 'paid feeds' },
      { value: 'Unlimited', label: 'episodes' },
    ],
    features: [
      { Icon: Rss, title: 'Real RSS feed', body: 'Distribute to Apple Podcasts, Spotify, and everywhere else.' },
      { Icon: Mic, title: 'Easy hosting', body: 'Upload an episode; we handle the feed and player.' },
      { Icon: CreditCard, title: 'Premium subscriptions', body: 'Sell access to a private bonus feed.' },
      { Icon: Globe, title: 'Your own page', body: 'yourname.podcastfortalent.com with a built-in player.' },
      { Icon: Users, title: 'Grow your audience', body: 'Subscriber tools and sharing baked in.' },
      { Icon: BarChart3, title: 'Episode analytics', body: 'See plays, subscribers, and trends.' },
    ],
    steps: [
      { title: 'Upload episodes', body: 'Drag in audio and add show notes.' },
      { title: 'Get your RSS', body: 'We generate a compliant feed automatically.' },
      { title: 'Submit to apps', body: 'Go live on Apple, Spotify, and more.' },
    ],
    faqs: [
      { q: 'Does it work with Apple & Spotify?', a: 'Yes — you get a standards-compliant RSS feed you submit once.' },
      { q: 'Can I charge for episodes?', a: 'Yes — gate bonus content behind a paid private feed.' },
      { q: 'Is there an episode limit?', a: 'No — publish as many as you like.' },
      { q: 'Where do listeners find me?', a: 'On your branded page and in every major podcast app.' },
    ],
    cta: 'Start my podcast',
  },
  stores: {
    product: 'stores',
    domain: 'nilstores.com',
    eyebrow: 'Merch Stores',
    headline: 'Sell your merch. Keep the margin.',
    sub: 'A branded store with print-on-demand and wholesale products, secure checkout, and automatic fulfillment — you set the prices.',
    Icon: ShoppingBag,
    hue: '#22C55E',
    chrome: 'browser',
    stats: [
      { value: 'POD', label: '+ wholesale' },
      { value: 'Auto', label: 'fulfillment' },
      { value: 'Your', label: 'profit margin' },
    ],
    features: [
      { Icon: Palette, title: 'Print-on-demand', body: 'Drop your logo on apparel and we generate live mockups.' },
      { Icon: Truck, title: 'Hands-off fulfillment', body: 'Orders print and ship automatically. You keep the profit.' },
      { Icon: CreditCard, title: 'Secure checkout', body: 'Stripe checkout, your prices, your payouts.' },
      { Icon: Sparkles, title: 'Designer storefront', body: 'Custom sections, fonts, and full brand control.' },
      { Icon: Globe, title: 'Your own domain', body: 'yourname.nilstores.com, styled to your brand.' },
      { Icon: BarChart3, title: 'Orders & payouts', body: 'Track every sale and get paid on schedule.' },
    ],
    steps: [
      { title: 'Add products', body: 'Pick blanks from the catalog or upload your own.' },
      { title: 'Style your store', body: 'Customize sections, colors, and fonts.' },
      { title: 'Share & sell', body: 'Send your link and start taking orders.' },
    ],
    faqs: [
      { q: 'Do I hold inventory?', a: 'No — print-on-demand items are made and shipped per order.' },
      { q: 'Who handles shipping?', a: 'Fulfillment is automatic. You set prices and keep the margin.' },
      { q: 'Can I customize the look?', a: 'Yes — add sections, change fonts and colors, and brand it fully.' },
      { q: 'How do I get paid?', a: 'Payouts run through Stripe straight to your account.' },
    ],
    cta: 'Open my store',
  },
  apps: {
    product: 'apps',
    domain: 'appsfortalent.com',
    eyebrow: 'Mobile Apps',
    headline: 'Your own mobile app.',
    sub: 'A branded app your fans install to their home screen — content, store, links, and push notifications, with no app-store hassle.',
    Icon: Smartphone,
    hue: '#06B6D4',
    chrome: 'phone',
    stats: [
      { value: '1 tap', label: 'to install' },
      { value: 'Push', label: 'notifications' },
      { value: 'No', label: 'app store needed' },
    ],
    features: [
      { Icon: Smartphone, title: 'Installable app', body: 'Fans add it to their home screen and it opens full-screen.' },
      { Icon: Bell, title: 'Push notifications', body: 'Reach your audience directly, any time.' },
      { Icon: LayoutTemplate, title: 'Your content', body: 'Screens for video, links, schedule, store, and more.' },
      { Icon: ShoppingBag, title: 'Sell inside the app', body: 'Your store, right where your fans are.' },
      { Icon: Palette, title: 'Fully branded', body: 'Your colors, logo, and app icon.' },
      { Icon: Zap, title: 'Instant updates', body: 'Change anything anytime — no resubmission.' },
    ],
    steps: [
      { title: 'Configure screens', body: 'Add the content and links you want.' },
      { title: 'Brand it', body: 'Set your colors, logo, and icon.' },
      { title: 'Share your link', body: 'Fans install in one tap from appsfortalent.com.' },
    ],
    faqs: [
      { q: 'Is it in the App Store?', a: 'It’s an installable web app — one tap to the home screen, no store review.' },
      { q: 'Can I send notifications?', a: 'Yes — push notifications reach installed fans directly.' },
      { q: 'Can I update it later?', a: 'Anytime, instantly — changes appear for everyone with no resubmission.' },
      { q: 'Can I sell in the app?', a: 'Yes — your store and links live right inside it.' },
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

function HeroVisual({ lp }: { lp: Landing }) {
  const Icon = lp.Icon
  return (
    <div className="relative mx-auto mt-12 w-full max-w-3xl">
      {/* glow */}
      <div
        className="absolute inset-0 -z-10 blur-3xl"
        style={{ background: `radial-gradient(60% 60% at 50% 40%, ${lp.hue}33, transparent)` }}
      />
      <div
        className="overflow-hidden rounded-[var(--radius)] border border-border shadow-2xl"
        style={{ background: `linear-gradient(160deg, ${lp.hue}22, var(--panel))` }}
      >
        {/* chrome */}
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-accent/60" />
          <span className="h-3 w-3 rounded-full bg-success/60" />
          <span className="ml-3 truncate rounded-md bg-background/50 px-3 py-1 text-xs text-muted-foreground">
            {lp.domain}
          </span>
        </div>
        <div className="grid place-items-center px-6 py-16">
          <div
            className="grid h-24 w-24 place-items-center rounded-3xl shadow-lg"
            style={{ background: lp.hue, color: '#0a0a0a' }}
          >
            <Icon className="h-12 w-12" strokeWidth={2} />
          </div>
          <div className="mt-6 h-3 w-48 rounded-full bg-foreground/10" />
          <div className="mt-2 h-3 w-32 rounded-full bg-foreground/10" />
          <div className="mt-6 flex gap-3">
            <div className="h-9 w-28 rounded-md" style={{ background: lp.hue }} />
            <div className="h-9 w-24 rounded-md border border-border bg-background/40" />
          </div>
        </div>
      </div>
    </div>
  )
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
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-display flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <lp.Icon className="h-4 w-4" style={{ color: lp.hue }} />
            {lp.domain}
          </span>
          <div className="flex items-center gap-4">
            <a
              href={`${SITE}/sign-in`}
              className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Sign in
            </a>
            <a
              href={signUp}
              className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
            >
              {lp.cta}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-8 pt-16 text-center sm:pt-24">
        <div className="mx-auto max-w-3xl">
          <p
            className="text-eyebrow inline-flex items-center gap-2"
            style={{ color: lp.hue }}
          >
            <Star className="h-3.5 w-3.5" /> {lp.eyebrow}
          </p>
          <h1 className="text-display mt-3 text-5xl font-black tracking-tight sm:text-6xl">
            {lp.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{lp.sub}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href={signUp}
              className="text-display inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
            >
              {lp.cta} <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={`${SITE}/services`}
              className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-panel"
            >
              See pricing
            </a>
          </div>
        </div>
        <HeroVisual lp={lp} />
      </section>

      {/* Stat bar */}
      <section className="border-y border-border bg-panel/30 px-6 py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 text-center">
          {lp.stats.map((s) => (
            <div key={s.label}>
              <p className="text-display text-2xl font-black sm:text-3xl" style={{ color: lp.hue }}>
                {s.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-display text-3xl font-black tracking-tight">
              Everything you need, nothing you don’t.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for athletes and creators — set up in minutes, look pro from day one.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lp.features.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius)] border border-border bg-panel/40 p-6 transition hover:border-primary/40"
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{ background: `${lp.hue}22`, color: lp.hue }}
                >
                  <f.Icon className="h-5 w-5" />
                </span>
                <p className="text-display mt-4 text-lg font-black">{f.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-panel/30 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-eyebrow" style={{ color: lp.hue }}>
              How it works
            </p>
            <h2 className="text-display mt-2 text-3xl font-black tracking-tight">
              Three steps. You’re live.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {lp.steps.map((s, i) => (
              <div key={s.title} className="rounded-[var(--radius)] border border-border bg-background/40 p-6">
                <span
                  className="text-display grid h-10 w-10 place-items-center rounded-full text-sm font-black"
                  style={{ background: lp.hue, color: '#0a0a0a' }}
                >
                  {i + 1}
                </span>
                <p className="text-display mt-4 text-lg font-black">{s.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-display text-center text-3xl font-black tracking-tight">
            Questions, answered.
          </h2>
          <div className="mt-10 space-y-3">
            {lp.faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-[var(--radius)] border border-border bg-panel/40 p-5"
              >
                <summary className="text-display flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold">
                  {f.q}
                  <Check className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:text-primary" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24">
        <div
          className="mx-auto max-w-5xl overflow-hidden rounded-[var(--radius)] border border-border px-6 py-16 text-center"
          style={{ background: `linear-gradient(160deg, ${lp.hue}26, var(--panel))` }}
        >
          <h2 className="text-display text-4xl font-black tracking-tight">Ready when you are.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free and publish on {lp.domain} today. No code, no hassle.
          </p>
          <a
            href={signUp}
            className="text-display mt-8 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
          >
            {lp.cta} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
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
