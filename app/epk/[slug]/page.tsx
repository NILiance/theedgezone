import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlockRenderer, type SiteBlock, type SiteData } from '@/components/site/block-renderer'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: epk } = await supabase
    .from('epks')
    .select('display_name, tagline, default_meta')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (!epk) return { title: 'EPK' }
  const meta = (epk.default_meta ?? {}) as { meta_title?: string; meta_description?: string }
  return {
    title: meta.meta_title ?? `${epk.display_name ?? slug} — Press Kit`,
    description: meta.meta_description ?? epk.tagline ?? undefined,
  }
}

export default async function PublicEpkPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: epk } = await supabase
    .from('epks')
    .select('id, slug, display_name, tagline, theme, social, status')
    .eq('slug', slug)
    .maybeSingle()
  if (!epk) notFound()
  if (epk.status !== 'published') notFound()

  const { data: blocks } = await supabase
    .from('epk_blocks')
    .select('id, position, block_type, props')
    .eq('epk_id', epk.id)
    .order('position', { ascending: true })

  const theme = (epk.theme ?? {}) as Record<string, unknown>
  const resolvedTheme =
    typeof theme.bg_color === 'string'
      ? theme
      : {
          primary: typeof theme.primary === 'string' ? theme.primary : '#C8A84E',
          secondary: typeof theme.secondary === 'string' ? theme.secondary : '#000000',
        }
  const social = (epk.social ?? {}) as Record<string, string>
  const siteData: SiteData = { siteId: epk.id }

  return (
    <main className="min-h-screen bg-background text-foreground">
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
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {epk.display_name ?? epk.slug}. Press Kit powered by{' '}
        <a href="https://theedgezone.com" className="text-primary hover:underline">
          The Edge Zone
        </a>
        .
      </footer>
    </main>
  )
}
