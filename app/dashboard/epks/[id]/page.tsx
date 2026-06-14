import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { BLOCK_TYPES } from '@/lib/site-builder/block-types'
import { defaultTokens, type ThemeTokens } from '@/lib/site-builder/theme-presets'
import { EpkBlockEditor } from './block-editor-wrapper'
import { EpkSettingsForm } from './settings-form'
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
  const { data: epk } = await supabase.from('epks').select('*').eq('id', id).single()
  if (!epk || epk.user_id !== user.id) notFound()

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

  const tokens: ThemeTokens = { ...defaultTokens(), ...(epk.theme as object) } as ThemeTokens
  const social = (epk.social ?? {}) as Record<string, string>

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

      <EpkSettingsForm
        epkId={epk.id}
        displayName={epk.display_name ?? null}
        tagline={epk.tagline ?? null}
        primary={tokens.primary}
        secondary={tokens.secondary}
      />

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
