import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { SiteSettingsForm } from '@/components/site/editor/site-settings-form'
import { PageList } from '@/components/site/editor/page-list'
import { BlockEditor } from '@/components/site/editor/block-editor'
import { addBlock, publishSite, unpublishSite } from '@/app/dashboard/sites/actions'
import type { SiteBlock } from '@/components/site/block-renderer'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pageId?: string }>
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

export default async function SiteEditorPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const user = await requireUser()
  const supabase = await createClient()

  const { data: site } = await supabase.from('sites').select('*').eq('id', id).single()
  if (!site || site.user_id !== user.id) notFound()

  const { data: pages } = await supabase
    .from('site_pages')
    .select('id, path, title, position')
    .eq('site_id', id)
    .order('position', { ascending: true })

  const pageList = pages ?? []
  // Prefer ?pageId=… (if it belongs to this site), else fall back to Home, else first page.
  const currentPage =
    pageList.find((p) => p.id === sp.pageId) ??
    pageList.find((p) => p.path === '/') ??
    pageList[0]

  const { data: rawBlocks } = currentPage
    ? await supabase
        .from('site_blocks')
        .select('id, position, block_type, props')
        .eq('page_id', currentPage.id)
        .order('position', { ascending: true })
    : { data: [] }

  const blocks: SiteBlock[] = (rawBlocks ?? []).map((b) => ({
    id: b.id,
    block_type: b.block_type,
    position: b.position,
    props: (b.props ?? {}) as Record<string, unknown>,
  }))

  const theme = (site.theme ?? {}) as { primary?: string; secondary?: string }
  const resolvedTheme = {
    primary: theme.primary ?? '#C8A84E',
    secondary: theme.secondary ?? '#000000',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {site.status === 'published' ? (
              <form action={unpublishSite}>
                <input type="hidden" name="site_id" value={site.id} />
                <Button type="submit" size="sm" variant="outline">
                  Unpublish
                </Button>
              </form>
            ) : (
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

      {/* Site settings */}
      <SiteSettingsForm
        siteId={site.id}
        displayName={site.display_name}
        tagline={site.tagline}
        primary={resolvedTheme.primary}
        secondary={resolvedTheme.secondary}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Pages */}
        <PageList
          siteId={site.id}
          pages={pageList}
          currentPageId={currentPage?.id ?? ''}
        />

        {/* Block list for current page */}
        <div className="space-y-4">
          {currentPage && (
            <div className="rounded-[var(--radius)] border border-border bg-panel/40 px-5 py-4">
              <p className="text-eyebrow text-primary">Editing</p>
              <p className="text-display mt-1 text-lg font-bold">
                {currentPage.title}{' '}
                <span className="font-mono text-sm text-muted-foreground">
                  {currentPage.path}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            {blocks.map((b, idx) => (
              <BlockEditor
                key={b.id}
                block={b}
                theme={resolvedTheme}
                isFirst={idx === 0}
                isLast={idx === blocks.length - 1}
              />
            ))}
            {blocks.length === 0 && (
              <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-8 text-center text-sm text-muted-foreground">
                No blocks on this page yet. Add one below.
              </p>
            )}
          </div>

          {currentPage && (
            <div className="rounded-[var(--radius)] border border-dashed border-border bg-panel/20 p-4">
              <p className="text-eyebrow mb-3 text-muted-foreground">Add block</p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map((b) => (
                  <form key={b.type} action={addBlock}>
                    <input type="hidden" name="page_id" value={currentPage.id} />
                    <input type="hidden" name="block_type" value={b.type} />
                    <Button type="submit" size="sm" variant="outline">
                      + {b.label}
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
