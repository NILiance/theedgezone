'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addPage, updatePage, deletePage } from '@/app/dashboard/sites/actions'

interface Page {
  id: string
  title: string
  path: string
  position: number
}

interface Props {
  siteId: string
  pages: Page[]
  currentPageId: string
}

export function PageList({ siteId, pages, currentPageId }: Props) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-eyebrow text-primary">Pages</p>
          <p className="text-sm text-muted-foreground">
            Multi-page site. Home (<code className="text-foreground">/</code>) is required.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding((s) => !s)}>
          {adding ? 'Cancel' : '+ New page'}
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
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Adding…' : 'Add page'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAdding(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <ul className="divide-y divide-border">
        {pages.map((p) => {
          const isHome = p.path === '/'
          const isActive = p.id === currentPageId
          const isEditing = editingId === p.id
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
              ) : (
                <div className="flex items-center justify-between gap-3 px-5 py-3">
                  <Link
                    href={`/dashboard/sites/${siteId}?pageId=${p.id}`}
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
                    <p className="truncate font-mono text-xs text-muted-foreground">{p.path}</p>
                  </Link>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(p.id)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>
                    {!isHome && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        ×
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
