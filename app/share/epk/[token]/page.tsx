import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { BlockRenderer, type SiteBlock, type SiteData } from '@/components/site/block-renderer'
import { createHash } from 'node:crypto'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ print?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params
  const supabase = createServiceClient()
  if (!supabase) return { title: 'Press Kit' }
  const { data: link } = await supabase
    .from('epk_share_links')
    .select('epk_id')
    .eq('token', token)
    .maybeSingle()
  if (!link) return { title: 'Press Kit' }
  const { data: epk } = await supabase
    .from('epks')
    .select('display_name, tagline')
    .eq('id', link.epk_id)
    .maybeSingle()
  return {
    title: epk?.display_name ? `${epk.display_name} — Press Kit` : 'Press Kit',
    description: epk?.tagline ?? undefined,
    robots: { index: false, follow: false },
  }
}

export default async function SharedEpkPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { print } = await searchParams
  const supabase = createServiceClient()
  if (!supabase) notFound()

  const { data: link } = await supabase
    .from('epk_share_links')
    .select('id, epk_id, expires_at, revoked_at, view_count')
    .eq('token', token)
    .maybeSingle()
  if (!link) notFound()
  if (link.revoked_at) {
    return <RevokedView />
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return <ExpiredView />
  }

  const { data: epk } = await supabase
    .from('epks')
    .select('id, slug, display_name, tagline, theme, social')
    .eq('id', link.epk_id)
    .maybeSingle()
  if (!epk) notFound()
  const { data: blocks } = await supabase
    .from('epk_blocks')
    .select('id, position, block_type, props')
    .eq('epk_id', epk.id)
    .order('position', { ascending: true })

  const hdrs = await headers()
  const ua = hdrs.get('user-agent') ?? null
  const referrer = hdrs.get('referer') ?? null
  const xff = hdrs.get('x-forwarded-for') ?? null
  const ip = xff?.split(',')[0]?.trim() ?? null
  const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 16) : null

  await supabase.from('epk_share_views').insert({
    share_link_id: link.id,
    user_agent: ua,
    ip_hash: ipHash,
    referrer,
  })
  await supabase
    .from('epk_share_links')
    .update({
      view_count: link.view_count + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', link.id)

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
  const isPrint = print === '1'

  return (
    <main className={isPrint ? 'epk-print-mode' : 'min-h-screen bg-background text-foreground'}>
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { background: white !important; color: black !important; }
          .epk-print-banner, .epk-print-hide { display: none !important; }
          section { break-inside: avoid; }
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
      {!isPrint && (
        <div className="epk-print-banner border-b border-border bg-panel/60 px-4 py-2 text-xs">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">
              You&apos;re viewing a private press kit. Please don&apos;t share this link.
            </span>
            <a
              href="?print=1"
              className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            >
              Print / save as PDF
            </a>
          </div>
        </div>
      )}
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
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {epk.display_name ?? epk.slug} · Press Kit by The Edge Zone
      </footer>
    </main>
  )
}

function RevokedView() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <p className="text-eyebrow text-destructive">Link revoked</p>
        <h1 className="text-display mt-2 text-2xl font-black">This press kit is no longer shared</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The athlete revoked this link. Reach out to them for a fresh one.
        </p>
      </div>
    </main>
  )
}

function ExpiredView() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <p className="text-eyebrow text-accent">Link expired</p>
        <h1 className="text-display mt-2 text-2xl font-black">This press kit link has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reach out to the athlete for a fresh share link.
        </p>
      </div>
    </main>
  )
}
