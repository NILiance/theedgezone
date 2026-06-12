'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { BlockRenderer, type SiteBlock } from '@/components/site/block-renderer'
import {
  HeroForm,
  TextForm,
  StatsForm,
  GalleryForm,
  SponsorsForm,
  CtaForm,
  ContactForm,
  VideoForm,
  GenericForm,
  type BlockFormProps,
} from '@/components/site/editor/block-forms'
import {
  updateBlockProps,
  removeBlock,
  moveBlock,
} from '@/app/dashboard/sites/actions'

interface Props {
  block: SiteBlock
  theme: { primary: string; secondary: string }
  isFirst: boolean
  isLast: boolean
}

function FormForType({ blockType, ...rest }: BlockFormProps & { blockType: string }) {
  switch (blockType) {
    case 'hero':
      return <HeroForm {...rest} />
    case 'text':
      return <TextForm {...rest} />
    case 'stats':
      return <StatsForm {...rest} />
    case 'gallery':
      return <GalleryForm {...rest} />
    case 'sponsors':
      return <SponsorsForm {...rest} />
    case 'cta':
      return <CtaForm {...rest} />
    case 'contact':
      return <ContactForm {...rest} />
    case 'video':
      return <VideoForm {...rest} />
    default:
      return <GenericForm {...rest} />
  }
}

export function BlockEditor({ block, theme, isFirst, isLast }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>(block.props)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    setError(null)
    const fd = new FormData()
    fd.set('block_id', block.id)
    fd.set('props', JSON.stringify(draft))
    startTransition(async () => {
      try {
        await updateBlockProps(fd)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Delete this block?')) return
    setError(null)
    const fd = new FormData()
    fd.set('block_id', block.id)
    startTransition(async () => {
      try {
        await removeBlock(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  const handleMove = (direction: 'up' | 'down') => {
    setError(null)
    const fd = new FormData()
    fd.set('block_id', block.id)
    fd.set('direction', direction)
    startTransition(async () => {
      try {
        await moveBlock(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Move failed')
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-panel-elevated/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-display rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            {block.block_type}
          </span>
          <span className="font-mono text-xs text-muted-foreground">#{block.position}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleMove('up')}
            disabled={isPending || isFirst}
            aria-label="Move up"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleMove('down')}
            disabled={isPending || isLast}
            aria-label="Move down"
          >
            ↓
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen((o) => !o)}
            disabled={isPending}
          >
            {open ? 'Close' : 'Edit'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete block"
          >
            ×
          </Button>
        </div>
      </div>

      {open ? (
        <div className="space-y-4 p-4">
          <FormForType blockType={block.block_type} props={draft} onChange={setDraft} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save block'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(block.props)
                setOpen(false)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>

          <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-background">
            <p className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Live preview
            </p>
            <div className="overflow-hidden">
              <BlockRenderer
                block={{ ...block, props: draft }}
                theme={theme}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden">
          <BlockRenderer block={block} theme={theme} />
        </div>
      )}
    </div>
  )
}
