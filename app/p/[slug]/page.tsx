import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = createServiceClient()
  if (!supabase) return { title: slug }
  const { data } = await supabase
    .from('cms_pages')
    .select('title, seo_title, seo_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.seo_title ?? data.title,
    description: data.seo_description ?? undefined,
  }
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/(?:^|\n)((?:- .+\n?)+)/g, (_m, group: string) => {
    const items = group
      .trim()
      .split('\n')
      .map((l: string) => l.replace(/^- /, '').trim())
      .map((l: string) => `<li>${l}</li>`)
      .join('')
    return `\n<ul>${items}</ul>`
  })
  html = html
    .split(/\n\n+/)
    .map((para) => {
      if (/^<(h\d|ul|ol|blockquote|pre)/.test(para.trim())) return para
      return `<p>${para.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')
  return html
}

export default async function PublicCmsPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createServiceClient()
  if (!supabase) notFound()
  const { data: page } = await supabase
    .from('cms_pages')
    .select('title, body_md, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (!page) notFound()

  const html = renderMarkdown(page.body_md ?? '')

  return (
    <div className="min-h-screen">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-display text-4xl font-black tracking-tight">{page.title}</h1>
        <article
          className="prose prose-invert mt-8 max-w-none [&_a]:text-primary [&_h2]:text-display [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:text-display [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_li]:my-1 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
      <Footer />
    </div>
  )
}
