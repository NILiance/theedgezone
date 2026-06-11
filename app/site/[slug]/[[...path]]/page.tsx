import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { BlockRenderer, type SiteBlock } from '@/components/site/block-renderer'

interface PageProps {
  params: Promise<{ slug: string; path?: string[] }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = createServiceClient()
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

export default async function PublicSitePage({ params }: PageProps) {
  const { slug, path } = await params
  const supabase = createServiceClient()

  const { data: site } = await supabase
    .from('sites')
    .select('id, slug, display_name, tagline, theme, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!site) notFound()

  // Owner can view drafts; everyone else can only view published. For now,
  // public renderer enforces published-only — owner preview goes via the
  // editor URL.
  if (site.status !== 'published') {
    notFound()
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

  const theme = ((site.theme ?? {}) as { primary?: string; secondary?: string })
  const resolvedTheme = {
    primary: theme.primary ?? '#C8A84E',
    secondary: theme.secondary ?? '#000000',
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav site={{ display_name: site.display_name, slug: site.slug }} pages={pages ?? []} />
      {(blocks ?? []).map((b) => (
        <BlockRenderer key={b.id} block={b as SiteBlock} theme={resolvedTheme} />
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
        <a href="/" className="text-display font-black tracking-tight">
          {site.display_name ?? site.slug}
        </a>
        <nav className="flex items-center gap-6 text-sm">
          {pages.map((p) => (
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
