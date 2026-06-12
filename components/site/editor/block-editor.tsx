'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { BlockRenderer, type SiteBlock } from '@/components/site/block-renderer'
import { BlockField } from '@/components/site/editor/block-field'
import { BLOCK_TYPES_BY_KEY } from '@/lib/site-builder/block-types'
import type { ThemeTokens } from '@/lib/site-builder/theme-presets'
import {
  updateBlockProps,
  removeBlock,
  moveBlock,
} from '@/app/dashboard/sites/actions'
import { improveBlock } from '@/app/dashboard/sites/generate-actions'

interface Props {
  block: SiteBlock
  theme: ThemeTokens
  social: Record<string, string>
  isFirst: boolean
  isLast: boolean
}

export function BlockEditor({ block, theme, social, isFirst, isLast }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>(block.props)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const def = BLOCK_TYPES_BY_KEY[block.block_type]
  const fields = def?.fields ?? []
  const label = def?.label ?? block.block_type

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

  const [improvePrompt, setImprovePrompt] = useState('')
  const [improveOpen, setImproveOpen] = useState(false)
  const handleImprove = () => {
    if (!improvePrompt.trim()) return
    setError(null)
    const fd = new FormData()
    fd.set('block_id', block.id)
    fd.set('prompt', improvePrompt)
    startTransition(async () => {
      const res = await improveBlock(fd)
      if (res.ok) {
        setImprovePrompt('')
        setImproveOpen(false)
      } else {
        setError(res.message ?? 'Improve failed')
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-panel-elevated/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-display rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            {def?.icon} {label}
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
            onClick={() => {
              setImproveOpen((s) => !s)
              setOpen(false)
            }}
            disabled={isPending}
            title="Improve this block with a prompt"
          >
            Improve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setOpen((o) => !o)
              setImproveOpen(false)
            }}
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

      {improveOpen && (
        <div className="space-y-3 border-b border-border bg-panel-elevated/30 p-4">
          <p className="text-eyebrow text-primary">Improve with prompt</p>
          <textarea
            value={improvePrompt}
            onChange={(e) => setImprovePrompt(e.target.value)}
            rows={2}
            placeholder="e.g. Make the headline punchier and lead with my position"
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleImprove} disabled={isPending || !improvePrompt.trim()}>
              {isPending ? 'Generating…' : 'Generate'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setImproveOpen(false)
                setImprovePrompt('')
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {open ? (
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{def?.desc}</p>
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No editable settings for this block.
              </p>
            ) : (
              fields.map((spec) => (
                <BlockField
                  key={spec.key}
                  spec={spec}
                  value={draft[spec.key]}
                  onChange={(next) => setDraft({ ...draft, [spec.key]: next })}
                />
              ))
            )}
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
          </div>

          <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-background">
            <p className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Live preview
            </p>
            <div className="overflow-hidden">
              <BlockRenderer
                block={{ ...block, props: draft }}
                theme={theme}
                social={social}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden">
          <BlockRenderer block={block} theme={theme} social={social} />
        </div>
      )}
    </div>
  )
}
