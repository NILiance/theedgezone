'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  addPage,
  updatePage,
  deletePage,
  updatePageStatus,
  updatePageSeo,
} from '@/app/dashboard/sites/actions'

interface Page {
  id: string
  title: string
  path: string
  position: number
  status: string
  nav_visible: boolean
  nav_label: string | null
  seo: Record<string, string>
}

interface Props {
  siteId: string
  pages: Page[]
  currentPageId: string
}

export function PageList({ siteId, pages, currentPageId }: Props) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [seoEditingId, setSeoEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAdd = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await addPage(fd)
        setAdding(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add page')
      }
    })
  }

  const handleUpdate = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await updatePage(fd)
        setEditingId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update page')
      }
    })
  }

  const handleDelete = (pageId: string) => {
    if (!confirm('Delete this page and all its blocks?')) return
    setError(null)
    const fd = new FormData()
    fd.set('page_id', pageId)
    startTransition(async () => {
      try {
        await deletePage(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete page')
      }
    })
  }

  const handleToggleStatus = (pageId: string, current: string) => {
    setError(null)
    const fd = new FormData()
    fd.set('page_id', pageId)
    fd.set('status', current === 'published' ? 'draft' : 'published')
    startTransition(async () => {
      try {
        await updatePageStatus(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status')
      }
    })
  }

  const handleSaveSeo = (pageId: string, seo: Record<string, string>) => {
    setError(null)
    const fd = new FormData()
    fd.set('page_id', pageId)
    fd.set('seo', JSON.stringify(seo))
    startTransition(async () => {
      try {
        await updatePageSeo(fd)
        setSeoEditingId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save SEO')
      }
    })
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-eyebrow text-primary">Pages</p>
          <p className="text-sm text-muted-foreground">
            Home (<code>/</code>) is required.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding((s) => !s)}>
          {adding ? 'Cancel' : '+ New'}
        </Button>
      </div>

      {error && (
        <div className="border-b border-destructive/40 bg-destructive/5 px-5 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {adding && (
        <form action={handleAdd} className="space-y-3 border-b border-border px-5 py-4">
          <input type="hidden" name="site_id" value={siteId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="add_title">Title</Label>
              <Input id="add_title" name="title" required placeholder="About" />
            </div>
            <div>
              <Label htmlFor="add_path">Path</Label>
              <Input
                id="add_path"
                name="path"
                required
                placeholder="/about"
                className="font-mono"
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Adding…' : 'Add page'}
          </Button>
        </form>
      )}

      <ul className="divide-y divide-border">
        {pages.map((p) => {
          const isHome = p.path === '/'
          const isActive = p.id === currentPageId
          const isEditing = editingId === p.id
          const isSeoEditing = seoEditingId === p.id
          return (
            <li key={p.id} className={isActive ? 'bg-primary/5' : ''}>
              {isEditing ? (
                <form action={handleUpdate} className="space-y-3 px-5 py-4">
                  <input type="hidden" name="page_id" value={p.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`title_${p.id}`}>Title</Label>
                      <Input
                        id={`title_${p.id}`}
                        name="title"
                        defaultValue={p.title}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`path_${p.id}`}>Path</Label>
                      <Input
                        id={`path_${p.id}`}
                        name="path"
                        defaultValue={p.path}
                        required
                        disabled={isHome}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : isSeoEditing ? (
                <SeoEditor
                  initial={p.seo}
                  onSave={(seo) => handleSaveSeo(p.id, seo)}
                  onCancel={() => setSeoEditingId(null)}
                  isPending={isPending}
                />
              ) : (
                <div className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/dashboard/sites/${siteId}?tab=pages&pageId=${p.id}`}
                      scroll={false}
                      className="min-w-0 flex-1"
                    >
                      <p
                        className={`text-display truncate text-sm font-bold ${
                          isActive ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {p.title}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {p.path}
                      </p>
                    </Link>
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        p.status === 'published'
                          ? 'bg-success/20 text-success'
                          : 'bg-panel-elevated text-muted-foreground'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(p.id)}
                      disabled={isPending}
                      className="h-7 px-2 text-xs"
                    >
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSeoEditingId(p.id)}
                      disabled={isPending}
                      className="h-7 px-2 text-xs"
                    >
                      SEO
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(p.id, p.status)}
                      disabled={isPending}
                      className="h-7 px-2 text-xs"
                    >
                      {p.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                    {!isHome && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SeoEditor({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: Record<string, string>
  onSave: (seo: Record<string, string>) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [draft, setDraft] = useState<Record<string, string>>(initial)
  return (
    <div className="space-y-3 px-5 py-4">
      <p className="text-eyebrow text-primary">SEO</p>
      <div>
        <Label>Meta title</Label>
        <Input
          defaultValue={draft.meta_title ?? ''}
          onChange={(e) => setDraft({ ...draft, meta_title: e.target.value })}
        />
      </div>
      <div>
        <Label>Meta description</Label>
        <textarea
          defaultValue={draft.meta_description ?? ''}
          onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })}
          rows={3}
          className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label>OG image URL</Label>
        <Input
          defaultValue={draft.og_image ?? ''}
          onChange={(e) => setDraft({ ...draft, og_image: e.target.value })}
          placeholder="https://…"
        />
      </div>
      <div>
        <Label>Keywords (comma-separated)</Label>
        <Input
          defaultValue={draft.keywords ?? ''}
          onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          defaultChecked={draft.noindex === 'true'}
          onChange={(e) =>
            setDraft({ ...draft, noindex: e.target.checked ? 'true' : 'false' })
          }
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm">Hide from search engines (noindex)</span>
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(draft)} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save SEO'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
