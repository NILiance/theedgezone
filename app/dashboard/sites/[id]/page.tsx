import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { BLOCK_TYPES } from '@/lib/site-builder/block-types'
import { defaultTokens, type ThemeTokens } from '@/lib/site-builder/theme-presets'
import { PageList } from '@/components/site/editor/page-list'
import { BlockEditor } from '@/components/site/editor/block-editor'
import { ThemeTab } from '@/components/site/editor/theme-tab'
import { TemplatesTab } from '@/components/site/editor/templates-tab'
import { GalleriesTab } from '@/components/site/editor/galleries-tab'
import { HeaderFooterTab, type HeaderConfig, type FooterConfig } from '@/components/site/editor/header-footer-tab'
import { DomainTab } from '@/components/site/editor/domain-tab'
import { addBlock, publishSite, unpublishSite } from '@/app/dashboard/sites/actions'
import type { SiteBlock } from '@/components/site/block-renderer'

type Tab = 'pages' | 'templates' | 'theme' | 'header' | 'galleries' | 'domain' | 'help'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; pageId?: string }>
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'pages', label: 'Pages' },
  { id: 'templates', label: 'Templates' },
  { id: 'theme', label: 'Theme' },
  { id: 'header', label: 'Header & Footer' },
  { id: 'galleries', label: 'Galleries' },
  { id: 'domain', label: 'Domain' },
  { id: 'help', label: 'Help' },
]

export const metadata = { title: 'Site Editor' }

export default async function SiteEditorPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const tab = (sp.tab as Tab) || 'pages'
  const user = await requireUser()
  const supabase = await createClient()

  const { data: site } = await supabase.from('sites').select('*').eq('id', id).single()
  if (!site || site.user_id !== user.id) notFound()

  // Theme tokens — fall back to gold preset for any missing keys.
  const tokens: ThemeTokens = { ...defaultTokens(), ...(site.theme as object) } as ThemeTokens
  const header = (site.header ?? {}) as HeaderConfig
  const footer = (site.footer ?? {}) as FooterConfig
  const social = (site.social ?? {}) as Record<string, string>

  return (
    <div className="space-y-6">
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

      <nav className="flex flex-wrap gap-1 rounded-[var(--radius)] border border-border bg-panel/40 p-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/sites/${id}?tab=${t.id}${
              t.id === 'pages' && sp.pageId ? `&pageId=${sp.pageId}` : ''
            }`}
            scroll={false}
            className={`text-display rounded-[var(--radius-sm)] px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'pages' && <PagesTab siteId={site.id} pageId={sp.pageId} tokens={tokens} social={social} />}
      {tab === 'templates' && (
        <TemplatesTab
          siteId={site.id}
          currentLayout={site.layout ?? 'classic'}
          currentTemplateId={site.template_id ?? null}
        />
      )}
      {tab === 'theme' && <ThemeTab siteId={site.id} tokens={tokens} />}
      {tab === 'header' && (
        <HeaderFooterTab siteId={site.id} header={header} footer={footer} social={social} />
      )}
      {tab === 'galleries' && <GalleriesTabLoader siteId={site.id} />}
      {tab === 'domain' && (
        <DomainTab slug={site.slug} status={site.status} customDomain={site.custom_domain} />
      )}
      {tab === 'help' && <HelpTab />}
    </div>
  )
}

async function PagesTab({
  siteId,
  pageId,
  tokens,
  social,
}: {
  siteId: string
  pageId?: string
  tokens: ThemeTokens
  social: Record<string, string>
}) {
  const supabase = await createClient()
  const { data: rawPages } = await supabase
    .from('site_pages')
    .select('id, path, title, position, status, nav_visible, nav_label, seo')
    .eq('site_id', siteId)
    .order('position', { ascending: true })

  const pages = rawPages ?? []
  const currentPage =
    pages.find((p) => p.id === pageId) ??
    pages.find((p) => p.path === '/') ??
    pages[0]

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

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <PageList
        siteId={siteId}
        pages={pages.map((p) => ({
          id: p.id,
          title: p.title,
          path: p.path,
          position: p.position,
          status: p.status,
          nav_visible: p.nav_visible,
          nav_label: p.nav_label,
          seo: (p.seo ?? {}) as Record<string, string>,
        }))}
        currentPageId={currentPage?.id ?? ''}
      />

      <div className="space-y-4">
        {currentPage && (
          <div className="rounded-[var(--radius)] border border-border bg-panel/40 px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-eyebrow text-primary">Editing page</p>
                <p className="text-display mt-1 text-lg font-bold">
                  {currentPage.title}{' '}
                  <span className="font-mono text-sm text-muted-foreground">
                    {currentPage.path}
                  </span>
                </p>
              </div>
              <span
                className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  currentPage.status === 'published'
                    ? 'bg-success/20 text-success'
                    : 'bg-panel-elevated text-muted-foreground'
                }`}
              >
                {currentPage.status}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {blocks.map((b, idx) => (
            <BlockEditor
              key={b.id}
              block={b}
              theme={tokens}
              social={social}
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

        {currentPage && <AddBlockPanel pageId={currentPage.id} />}
      </div>
    </div>
  )
}

function AddBlockPanel({ pageId }: { pageId: string }) {
  const groups: Array<{ id: 'mysite' | 'fans' | 'revenue'; label: string }> = [
    { id: 'mysite', label: 'My site' },
    { id: 'fans', label: 'For my fans' },
    { id: 'revenue', label: 'Revenue' },
  ]
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-border bg-panel/20 p-4">
      <p className="text-eyebrow mb-3 text-muted-foreground">Add block</p>
      <div className="space-y-4">
        {groups.map((g) => {
          const blocks = BLOCK_TYPES.filter((b) => b.category === g.id)
          if (blocks.length === 0) return null
          return (
            <div key={g.id}>
              <p className="text-display mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                {g.label}
              </p>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {blocks.map((b) => (
                  <form key={b.type} action={addBlock}>
                    <input type="hidden" name="page_id" value={pageId} />
                    <input type="hidden" name="block_type" value={b.type} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-auto w-full justify-start gap-2 px-3 py-2 text-left"
                      title={b.desc}
                    >
                      <span className="text-base">{b.icon}</span>
                      <span className="flex-1 truncate text-xs font-bold">{b.label}</span>
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

async function GalleriesTabLoader({ siteId }: { siteId: string }) {
  const supabase = await createClient()
  const { data: galleries } = await supabase
    .from('site_galleries')
    .select('id, name, images')
    .eq('site_id', siteId)
    .order('updated_at', { ascending: false })

  return (
    <GalleriesTab
      siteId={siteId}
      galleries={(galleries ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        images: Array.isArray(g.images)
          ? (g.images as Array<{ url: string; alt?: string }>)
          : [],
      }))}
    />
  )
}

function HelpTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-6">
        <p className="text-eyebrow text-primary">Quick start</p>
        <ol className="mt-3 space-y-2 text-sm">
          <li>1. Pick a theme preset under the Theme tab to set your colors and fonts.</li>
          <li>2. Add your social handles under Header & Footer → Social handles.</li>
          <li>3. Open the Home page in the Pages tab and replace the seed hero with your real story.</li>
          <li>4. Add blocks (stats, testimonials, sponsors) to flesh out your page.</li>
          <li>5. Add an About page and a Contact page from the Pages sidebar.</li>
          <li>6. When you’re happy, hit Publish at the top right.</li>
        </ol>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-6">
        <p className="text-eyebrow text-primary">Block library</p>
        <p className="mt-2 text-sm text-muted-foreground">
          26 block types organized for athletes:{' '}
          {BLOCK_TYPES.map((b) => b.label).join(' · ')}.
        </p>
      </div>
    </div>
  )
}
