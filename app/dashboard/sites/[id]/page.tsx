import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { addBlock, publishSite } from '@/app/dashboard/sites/actions'

interface PageProps {
  params: Promise<{ id: string }>
}

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero' },
  { type: 'text', label: 'Text' },
  { type: 'stats', label: 'Stats' },
  { type: 'gallery', label: 'Gallery' },
  { type: 'sponsors', label: 'Sponsors' },
  { type: 'video', label: 'Video' },
  { type: 'cta', label: 'CTA' },
  { type: 'contact', label: 'Contact' },
] as const

export const metadata = { title: 'Site Editor' }

export default async function SiteEditorPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()

  const { data: site } = await supabase.from('sites').select('*').eq('id', id).single()
  if (!site || site.user_id !== user.id) notFound()

  const { data: pages } = await supabase
    .from('site_pages')
    .select('id, path, title, position')
    .eq('site_id', id)
    .order('position', { ascending: true })

  const homePage = pages?.find((p) => p.path === '/') ?? pages?.[0]
  const { data: blocks } = homePage
    ? await supabase
        .from('site_blocks')
        .select('id, position, block_type, props')
        .eq('page_id', homePage.id)
        .order('position', { ascending: true })
    : { data: [] }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/sites"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Sites
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-accent">Site Editor</p>
            <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
              {site.display_name ?? site.slug}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {site.slug}.mytalentsite.com ·{' '}
              <span
                className={
                  site.status === 'published' ? 'text-success' : 'text-muted-foreground'
                }
              >
                {site.status}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/site/${site.slug}`} target="_blank">
              <Button size="sm" variant="outline">
                Preview
              </Button>
            </Link>
            {site.status !== 'published' && (
              <form action={publishSite}>
                <input type="hidden" name="site_id" value={site.id} />
                <Button type="submit" size="sm">
                  Publish
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pages</CardTitle>
          <CardDescription>
            Multi-page editing comes in the next iteration. For now, the Home page is the
            primary editable surface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {(pages ?? []).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border bg-panel/40 px-3 py-2 text-sm"
              >
                <span>
                  <span className="text-display font-bold text-foreground">{p.title}</span>{' '}
                  <span className="font-mono text-muted-foreground">{p.path}</span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {homePage && (
        <section>
          <p className="text-eyebrow mb-3 text-primary">Blocks on home page</p>
          <div className="space-y-3">
            {(blocks ?? []).map((b) => (
              <BlockRow key={b.id} block={b} />
            ))}
            {(blocks ?? []).length === 0 && (
              <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-6 text-center text-sm text-muted-foreground">
                No blocks yet. Add one below.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {BLOCK_TYPES.map((b) => (
              <form key={b.type} action={addBlock}>
                <input type="hidden" name="page_id" value={homePage.id} />
                <input type="hidden" name="block_type" value={b.type} />
                <Button type="submit" size="sm" variant="outline">
                  + {b.label}
                </Button>
              </form>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BlockRow({
  block,
}: {
  block: { id: string; position: number; block_type: string; props: unknown }
}) {
  const props = block.props as Record<string, unknown>
  const summary = summariseBlock(block.block_type, props)
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-display text-sm font-bold uppercase tracking-widest text-primary">
            {block.block_type}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{summary}</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground/70">#{block.position}</span>
      </div>
    </div>
  )
}

function summariseBlock(type: string, props: Record<string, unknown>): string {
  switch (type) {
    case 'hero':
      return `${props.title ?? ''} — ${props.subtitle ?? ''}`
    case 'text':
      return ((props.content as string) ?? '').slice(0, 80)
    case 'stats':
      return `${((props.items as unknown[]) ?? []).length} stats`
    case 'gallery':
      return `${((props.images as unknown[]) ?? []).length} images`
    case 'sponsors':
      return `${((props.logos as unknown[]) ?? []).length} logos`
    default:
      return ''
  }
}
