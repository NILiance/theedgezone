'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { updateHeader, updateFooter, updateSocial } from '@/app/dashboard/sites/actions'

export interface HeaderConfig {
  logo_url?: string
  logo_height?: number
  show_site_title?: boolean
  show_nav?: boolean
  show_social_icons?: boolean
  show_search?: boolean
  cta_text?: string
  cta_url?: string
  cta_visible?: boolean
}

export interface FooterElement {
  type: 'copyright' | 'nav_links' | 'social_icons' | 'logo' | 'newsletter' | 'contact_info' | 'custom_text' | 'branding'
  props?: Record<string, unknown>
}

export interface FooterColumn {
  elements: FooterElement[]
  heading?: string
}

export interface FooterConfig {
  columns?: FooterColumn[]
  bg_color?: string
  text_color?: string
}

const SOCIAL_PLATFORMS = [
  'instagram',
  'tiktok',
  'youtube',
  'twitter',
  'facebook',
  'linkedin',
  'spotify',
  'apple_music',
] as const

const FOOTER_ELEMENT_TYPES: FooterElement['type'][] = [
  'copyright',
  'nav_links',
  'social_icons',
  'logo',
  'newsletter',
  'contact_info',
  'custom_text',
  'branding',
]

interface Props {
  siteId: string
  header: HeaderConfig
  footer: FooterConfig
  social: Record<string, string>
}

function HeaderLogoPicker({
  value,
  onChange,
  siteId,
}: {
  value: string
  onChange: (v: string) => void
  siteId: string
}) {
  return <AssetPicker value={value} onChange={onChange} siteId={siteId} accept="image/*" />
}

export function HeaderFooterTab({ siteId, header, footer, social }: Props) {
  const [section, setSection] = useState<'header' | 'footer' | 'social'>('header')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['header', 'Header'],
            ['footer', 'Footer'],
            ['social', 'Social handles'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              section === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'header' && <HeaderEditor siteId={siteId} header={header} />}
      {section === 'footer' && <FooterEditor siteId={siteId} footer={footer} />}
      {section === 'social' && <SocialEditor siteId={siteId} social={social} />}
    </div>
  )
}

interface HeaderEditorProps { siteId: string; header: HeaderConfig }
function HeaderEditor({ siteId, header }: HeaderEditorProps) {
  const [draft, setDraft] = useState<HeaderConfig>(header)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    setError(null)
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('header', JSON.stringify(draft))
    startTransition(async () => {
      try {
        await updateHeader(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Logo</Label>
        <HeaderLogoPicker
          value={draft.logo_url ?? ''}
          onChange={(v) => setDraft({ ...draft, logo_url: v })}
          siteId={siteId}
        />
      </div>
      <div>
        <Label>Logo height (px)</Label>
        <Input
          type="number"
          defaultValue={draft.logo_height ?? 40}
          onChange={(e) => setDraft({ ...draft, logo_height: Number(e.target.value) })}
        />
      </div>
      <Toggle
        label="Show site title text"
        value={draft.show_site_title ?? true}
        onChange={(v) => setDraft({ ...draft, show_site_title: v })}
      />
      <Toggle
        label="Show navigation"
        value={draft.show_nav ?? true}
        onChange={(v) => setDraft({ ...draft, show_nav: v })}
      />
      <Toggle
        label="Show social icons"
        value={draft.show_social_icons ?? false}
        onChange={(v) => setDraft({ ...draft, show_social_icons: v })}
      />
      <Toggle
        label="Show search"
        value={draft.show_search ?? false}
        onChange={(v) => setDraft({ ...draft, show_search: v })}
      />
      <Toggle
        label="Show CTA button"
        value={draft.cta_visible ?? false}
        onChange={(v) => setDraft({ ...draft, cta_visible: v })}
      />
      {draft.cta_visible && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>CTA text</Label>
            <Input
              defaultValue={draft.cta_text ?? ''}
              onChange={(e) => setDraft({ ...draft, cta_text: e.target.value })}
            />
          </div>
          <div>
            <Label>CTA URL</Label>
            <Input
              defaultValue={draft.cta_url ?? ''}
              onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save header'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDraft(header)} disabled={isPending}>
          Revert
        </Button>
      </div>
    </div>
  )
}

function FooterEditor({ siteId, footer }: { siteId: string; footer: FooterConfig }) {
  const [draft, setDraft] = useState<FooterConfig>({
    columns: footer.columns ?? [
      { heading: 'About', elements: [{ type: 'logo' }, { type: 'custom_text', props: { content: 'Tagline goes here.' } }] },
      { heading: 'Connect', elements: [{ type: 'social_icons' }] },
      { heading: 'Legal', elements: [{ type: 'copyright' }, { type: 'branding' }] },
    ],
    bg_color: footer.bg_color ?? '',
    text_color: footer.text_color ?? '',
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const cols = draft.columns ?? []
  const setCols = (next: FooterColumn[]) => setDraft({ ...draft, columns: next })

  const updateCol = (idx: number, patch: Partial<FooterColumn>) =>
    setCols(cols.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  const removeCol = (idx: number) => setCols(cols.filter((_, i) => i !== idx))
  const addCol = () =>
    setCols([...cols, { heading: 'New column', elements: [{ type: 'custom_text', props: { content: '' } }] }])

  const addElement = (colIdx: number, type: FooterElement['type']) => {
    updateCol(colIdx, {
      elements: [...cols[colIdx]!.elements, { type, props: {} }],
    })
  }
  const removeElement = (colIdx: number, elIdx: number) => {
    updateCol(colIdx, {
      elements: cols[colIdx]!.elements.filter((_, i) => i !== elIdx),
    })
  }

  const save = () => {
    setError(null)
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('footer', JSON.stringify(draft))
    startTransition(async () => {
      try {
        await updateFooter(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Background color (optional)</Label>
          <Input
            defaultValue={draft.bg_color ?? ''}
            onChange={(e) => setDraft({ ...draft, bg_color: e.target.value })}
            placeholder="#000000"
            className="font-mono text-xs"
          />
        </div>
        <div>
          <Label>Text color (optional)</Label>
          <Input
            defaultValue={draft.text_color ?? ''}
            onChange={(e) => setDraft({ ...draft, text_color: e.target.value })}
            placeholder="#ffffff"
            className="font-mono text-xs"
          />
        </div>
      </div>

      <DragDropFooterColumns
        cols={cols}
        onCols={setCols}
        onAddElement={addElement}
        onRemoveElement={removeElement}
        onAddCol={addCol}
        onRemoveCol={removeCol}
        onUpdateCol={updateCol}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save footer'}
        </Button>
      </div>
    </div>
  )
}

function DragDropFooterColumns({
  cols,
  onCols,
  onAddElement,
  onRemoveElement,
  onAddCol,
  onRemoveCol,
  onUpdateCol,
}: {
  cols: FooterColumn[]
  onCols: (next: FooterColumn[]) => void
  onAddElement: (colIdx: number, type: FooterElement['type']) => void
  onRemoveElement: (colIdx: number, elIdx: number) => void
  onAddCol: () => void
  onRemoveCol: (idx: number) => void
  onUpdateCol: (idx: number, patch: Partial<FooterColumn>) => void
}) {
  const [dragged, setDragged] = useState<{ col: number; el: number } | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)

  const handleDragStart = (col: number, el: number) => setDragged({ col, el })
  const handleDragEnd = () => {
    setDragged(null)
    setHoverCol(null)
  }
  const handleDrop = (targetCol: number, targetEl?: number) => {
    if (!dragged) return
    const { col: fromCol, el: fromEl } = dragged
    if (fromCol === targetCol && fromEl === targetEl) {
      handleDragEnd()
      return
    }
    const next = cols.map((c) => ({ ...c, elements: [...c.elements] }))
    const item = next[fromCol]!.elements.splice(fromEl, 1)[0]!
    const insertAt = targetEl ?? next[targetCol]!.elements.length
    next[targetCol]!.elements.splice(insertAt, 0, item)
    onCols(next)
    handleDragEnd()
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-3">
        {cols.map((col, colIdx) => (
          <div
            key={colIdx}
            onDragOver={(e) => {
              e.preventDefault()
              setHoverCol(colIdx)
            }}
            onDragLeave={() => setHoverCol((prev) => (prev === colIdx ? null : prev))}
            onDrop={() => handleDrop(colIdx)}
            className={`rounded-[var(--radius-sm)] border bg-panel/40 p-3 transition-colors ${
              hoverCol === colIdx ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <Input
                defaultValue={col.heading ?? ''}
                onChange={(e) => onUpdateCol(colIdx, { heading: e.target.value })}
                placeholder="Column heading"
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onRemoveCol(colIdx)}
                className="text-destructive"
              >
                ×
              </Button>
            </div>
            <ul className="space-y-1">
              {col.elements.map((el, elIdx) => {
                const isDragging =
                  dragged && dragged.col === colIdx && dragged.el === elIdx
                return (
                  <li
                    key={elIdx}
                    draggable
                    onDragStart={() => handleDragStart(colIdx, elIdx)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => {
                      e.stopPropagation()
                      handleDrop(colIdx, elIdx)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className={`flex cursor-grab items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-xs transition-opacity ${
                      isDragging ? 'opacity-40' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 capitalize">
                      <span className="text-muted-foreground">⠿</span>
                      {el.type.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveElement(colIdx, elIdx)}
                      className="text-destructive hover:opacity-70"
                    >
                      remove
                    </button>
                  </li>
                )
              })}
              {col.elements.length === 0 && (
                <li className="rounded-[var(--radius-sm)] border border-dashed border-border px-2 py-3 text-center text-xs text-muted-foreground">
                  Drop element here
                </li>
              )}
            </ul>
            <select
              value=""
              onChange={(e) => {
                const t = e.target.value as FooterElement['type']
                if (t) onAddElement(colIdx, t)
                e.target.value = ''
              }}
              className="mt-2 h-8 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 text-xs"
            >
              <option value="">+ Add element…</option>
              {FOOTER_ELEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Drag the ⠿ handle to move elements between columns.
      </p>
      <Button type="button" size="sm" variant="outline" onClick={onAddCol}>
        + Add column
      </Button>
    </>
  )
}

function SocialEditor({ siteId, social }: { siteId: string; social: Record<string, string> }) {
  const [draft, setDraft] = useState<Record<string, string>>(social ?? {})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    setError(null)
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('social', JSON.stringify(draft))
    startTransition(async () => {
      try {
        await updateSocial(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Paste your handle URLs. These power the social feed block, footer social icons, and SEO.
      </p>
      {SOCIAL_PLATFORMS.map((p) => (
        <div key={p}>
          <Label className="capitalize">{p.replace('_', ' ')}</Label>
          <Input
            defaultValue={draft[p] ?? ''}
            onChange={(e) => setDraft({ ...draft, [p]: e.target.value })}
            placeholder={`https://www.${p.replace('_', '')}.com/yourname`}
          />
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save social'}
        </Button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        defaultChecked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      <span className="text-sm">{label}</span>
    </label>
  )
}
