import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlockRenderer, type SiteBlock, type SiteData } from '@/components/site/block-renderer'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ print?: string }>
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

export default async function PublicEpkPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { print } = await searchParams
  const isPrint = print === '1'
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
    <main className={isPrint ? 'epk-print-mode' : 'min-h-screen bg-background text-foreground'}>
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { background: white !important; color: black !important; }
          .epk-print-hide { display: none !important; }
          section { break-inside: avoid; page-break-inside: avoid; }
        }
        .epk-print-mode {
          background: white;
          color: black;
          min-height: 100vh;
        }
        .epk-print-mode section {
          break-inside: avoid;
        }
      `}</style>
      {(blocks ?? []).map((b) => (
        <BlockRenderer
          key={b.id}
          block={b as SiteBlock}
          theme={resolvedTheme as Parameters<typeof BlockRenderer>[0]['theme']}
          social={social}
          siteData={siteData}
          interactive={!isPrint}
        />
      ))}
      <footer
        className={`border-t border-border py-8 text-center text-xs ${
          isPrint ? 'text-gray-500' : 'text-muted-foreground epk-print-hide'
        }`}
      >
        © {new Date().getFullYear()} {epk.display_name ?? epk.slug}. Press Kit powered by{' '}
        {isPrint ? (
          'The Edge Zone'
        ) : (
          <a href="https://theedgezone.com" className="text-primary hover:underline">
            The Edge Zone
          </a>
        )}
        .
      </footer>
    </main>
  )
}
