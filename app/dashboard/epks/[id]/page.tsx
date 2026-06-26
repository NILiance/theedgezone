import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { BLOCK_TYPES } from '@/lib/site-builder/block-types'
import { defaultTokens, type ThemeTokens } from '@/lib/site-builder/theme-presets'
import { EpkBlockEditor } from './block-editor-wrapper'
import { EpkSettingsForm } from './settings-form'
import { EpkTemplatePicker } from './template-picker'
import { SharePanel } from './share-panel'
import { addEpkBlock, publishEpk, unpublishEpk } from '../actions'
import type { SiteBlock } from '@/components/site/block-renderer'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'EPK editor' }

export default async function EpkEditorPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const { data: epk } = await supabase.from('epks').select('*').eq('id', id).maybeSingle()
  if (!epk || epk.user_id !== user.id) return <MissingEpkState />

  const { data: rawBlocks } = await supabase
    .from('epk_blocks')
    .select('id, position, block_type, props')
    .eq('epk_id', id)
    .order('position', { ascending: true })

  const blocks: SiteBlock[] = (rawBlocks ?? []).map((b) => ({
    id: b.id,
    block_type: b.block_type,
    position: b.position,
    props: (b.props ?? {}) as Record<string, unknown>,
  }))

  const themeObj = (epk.theme ?? {}) as Record<string, unknown>
  const lightMode = themeObj.mode === 'light'
  const tokens: ThemeTokens = {
    ...defaultTokens(),
    ...(epk.theme as object),
    // The saved EPK theme only stores primary/secondary/mode/font — derive the
    // light-mode surface colors so the editor preview matches the public page.
    ...(lightMode
      ? {
          bg_color: '#ffffff',
          card_bg: '#f5f5f5',
          border_color: '#e5e5e5',
          text_color: '#0a0a0a',
          heading_color: '#0a0a0a',
          muted_color: '#525252',
        }
      : {}),
  } as ThemeTokens
  const social = (epk.social ?? {}) as Record<string, string>

  const { data: shareLinks } = await supabase
    .from('epk_share_links')
    .select(
      'id, token, label, recipient_email, expires_at, revoked_at, view_count, last_viewed_at, created_at'
    )
    .eq('epk_id', id)
    .order('created_at', { ascending: false })
    .limit(20)
  const publicUrl = `/epk/${epk.slug}`

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/epks"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← EPKs
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-accent">EPK editor</p>
            <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
              {epk.display_name ?? epk.slug}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {epk.slug}.talentepk.com ·{' '}
              <span className={epk.status === 'published' ? 'text-success' : 'text-muted-foreground'}>
                {epk.status}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/epk/${epk.slug}`} target="_blank">
              <Button size="sm" variant="outline">
                Preview
              </Button>
            </Link>
            {epk.status === 'published' ? (
              <form action={unpublishEpk}>
                <input type="hidden" name="epk_id" value={epk.id} />
                <Button type="submit" size="sm" variant="outline">
                  Unpublish
                </Button>
              </form>
            ) : (
              <form action={publishEpk}>
                <input type="hidden" name="epk_id" value={epk.id} />
                <Button type="submit" size="sm">
                  Publish
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <EpkTemplatePicker epkId={epk.id} current={(epk.template_id as string | null) ?? null} />

      <EpkSettingsForm
        epkId={epk.id}
        displayName={epk.display_name ?? null}
        tagline={epk.tagline ?? null}
        primary={tokens.primary}
        secondary={tokens.secondary}
        mode={tokens.mode}
        fontHeading={tokens.font_heading}
      />

      <SharePanel epkId={epk.id} publicUrl={publicUrl} shareLinks={shareLinks ?? []} />

      <div className="space-y-3">
        {blocks.map((b, idx) => (
          <EpkBlockEditor
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
            No blocks on this EPK yet. Add one below.
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius)] border border-dashed border-border bg-panel/20 p-4">
        <p className="text-eyebrow mb-3 text-muted-foreground">Add block</p>
        <div className="space-y-4">
          {(['mysite', 'fans', 'revenue'] as const).map((cat) => {
            const list = BLOCK_TYPES.filter((b) => b.category === cat)
            if (list.length === 0) return null
            return (
              <div key={cat}>
                <p className="text-display mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                  {cat === 'mysite' ? 'Sections' : cat === 'fans' ? 'For my fans' : 'Revenue'}
                </p>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((b) => (
                    <form key={b.type} action={addEpkBlock}>
                      <input type="hidden" name="epk_id" value={epk.id} />
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
    </div>
  )
}

function MissingEpkState() {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/epks"
        className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← EPKs
      </Link>
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
        <p className="text-eyebrow text-accent">EPK not found</p>
        <h1 className="text-display mt-2 text-2xl font-black tracking-tight">
          This EPK no longer exists
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The link you followed points to an EPK that was deleted or never finished
          creating. Your other EPKs are still here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard/epks">
            <Button size="sm">Back to your EPKs</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
