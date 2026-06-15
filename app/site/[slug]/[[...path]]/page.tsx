import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlockRenderer, type SiteBlock, type SiteData } from '@/components/site/block-renderer'
import { TrackView } from '@/components/site/track-view'
import { AffiliateRefCapture } from '@/components/site/checkout-buttons'

interface PageProps {
  params: Promise<{ slug: string; path?: string[] }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: site } = await supabase
    .from('sites')
    .select('display_name, default_meta')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (!site) return { title: 'Site' }
  const meta = (site.default_meta ?? {}) as { meta_title?: string; meta_description?: string }
  return {
    title: meta.meta_title ?? site.display_name ?? slug,
    description: meta.meta_description,
  }
}

async function isViewerAuthorized(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteUserId: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  if (user.id === siteUserId) return true
  const { data: adminRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()
  return Boolean(adminRow)
}

export default async function PublicSitePage({ params, searchParams }: PageProps) {
  const { slug, path } = await params
  const { preview } = await searchParams
  const supabase = await createClient()

  const { data: site } = await supabase
    .from('sites')
    .select('id, slug, display_name, tagline, theme, status, social, header, footer, user_id')
    .eq('slug', slug)
    .maybeSingle()

  if (!site) notFound()

  // Owner + admin can preview drafts via ?preview=1; public visitors only
  // get published sites.
  if (site.status !== 'published') {
    if (preview !== '1' || !(await isViewerAuthorized(supabase, site.user_id))) {
      notFound()
    }
  }

  const requestedPath = '/' + (path?.join('/') ?? '')

  const { data: pages } = await supabase
    .from('site_pages')
    .select('id, path, title, meta')
    .eq('site_id', site.id)

  const page = pages?.find((p) => p.path === requestedPath) ?? pages?.find((p) => p.path === '/')
  if (!page) notFound()

  const { data: blocks } = await supabase
    .from('site_blocks')
    .select('id, position, block_type, props')
    .eq('page_id', page.id)
    .order('position', { ascending: true })

  // Pull any per-site data the blocks might want to render against.
  const [productsRes, tiersRes, rewardsRes, guestbookRes] = await Promise.all([
    supabase
      .from('site_products')
      .select('id, name, description, price_cents, currency, image_url')
      .eq('site_id', site.id)
      .eq('active', true)
      .order('position', { ascending: true }),
    supabase
      .from('site_membership_tiers')
      .select('id, name, description, price_cents, billing_interval, perks')
      .eq('site_id', site.id)
      .eq('active', true)
      .order('position', { ascending: true }),
    supabase
      .from('site_support_rewards')
      .select('id, name, description, image_url, unlock_amount_cents, reward_type')
      .eq('site_id', site.id)
      .eq('active', true)
      .order('position', { ascending: true }),
    supabase
      .from('site_guestbook_entries')
      .select('id, display_name, message, created_at, block_id')
      .eq('site_id', site.id)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const siteData: SiteData = {
    siteId: site.id,
    products: (productsRes.data ?? []) as SiteData['products'],
    tiers: (tiersRes.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price_cents: t.price_cents,
      billing_interval: t.billing_interval,
      perks: Array.isArray(t.perks) ? (t.perks as string[]) : [],
    })),
    rewards: (rewardsRes.data ?? []) as SiteData['rewards'],
    guestbookEntries: (guestbookRes.data ?? []) as SiteData['guestbookEntries'],
  }

  const theme = (site.theme ?? {}) as Record<string, unknown>
  const resolvedTheme =
    typeof theme.bg_color === 'string'
      ? theme
      : {
          primary: typeof theme.primary === 'string' ? theme.primary : '#C8A84E',
          secondary: typeof theme.secondary === 'string' ? theme.secondary : '#000000',
        }

  const social = (site.social ?? {}) as Record<string, string>

  const isPreview = preview === '1' && site.status !== 'published'

  return (
    <main className="min-h-screen bg-background text-foreground">
      {isPreview && (
        <div className="bg-accent text-accent-foreground px-4 py-2 text-center text-xs font-bold uppercase tracking-widest">
          Preview · {site.status} · not visible to the public
        </div>
      )}
      {!isPreview && <TrackView siteId={site.id} pageId={page.id} path={requestedPath} />}
      <AffiliateRefCapture />
      <SiteNav site={{ display_name: site.display_name, slug: site.slug }} pages={pages ?? []} />
      {(blocks ?? []).map((b) => (
        <BlockRenderer
          key={b.id}
          block={b as SiteBlock}
          theme={resolvedTheme as Parameters<typeof BlockRenderer>[0]['theme']}
          social={social}
          siteData={siteData}
          interactive
        />
      ))}
      <SiteFooter site={{ display_name: site.display_name, slug: site.slug }} />
    </main>
  )
}

function SiteNav({
  site,
  pages,
}: {
  site: { display_name: string | null; slug: string }
  pages: Array<{ path: string; title: string }>
}) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Plain <a> intentional: this nav lives at runtime under either
            /site/<slug>/* (Vercel preview) or <slug>.mytalentsite.com/* (after
            middleware rewrite). next/link would prefetch real Next routes,
            which these aren't — they're dynamic per-tenant pages. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="text-display font-black tracking-tight">
          {site.display_name ?? site.slug}
        </a>
        <nav className="flex items-center gap-6 text-sm">
          {pages.map((p) => (
            /* eslint-disable-next-line @next/next/no-html-link-for-pages */
            <a key={p.path} href={p.path} className="text-muted-foreground hover:text-foreground">
              {p.title}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function SiteFooter({ site }: { site: { display_name: string | null; slug: string } }) {
  return (
    <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
      &copy; {new Date().getFullYear()} {site.display_name ?? site.slug}. Powered by
      The Edge Zone.
    </footer>
  )
}
