'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  upsertResource,
  deleteResource,
  upsertCategory,
  deleteCategory,
} from './actions'

interface Resource {
  id: string
  slug: string
  title: string
  description: string | null
  audience: string
  category_id: string | null
  file_url: string | null
  thumbnail_url: string | null
  external_url: string | null
  featured: boolean
  published: boolean
  download_count: number
  view_count: number
  created_at: string
}

interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  position: number
}

interface Props {
  resources: Resource[]
  categories: Category[]
}

export function ResourcesAdminClient({ resources, categories }: Props) {
  const [section, setSection] = useState<'resources' | 'categories'>('resources')
  const [editing, setEditing] = useState<Resource | 'new' | null>(null)
  const [editingCat, setEditingCat] = useState<Category | 'new' | null>(null)

  if (editing) {
    return (
      <ResourceEditor
        resource={editing === 'new' ? null : editing}
        categories={categories}
        onClose={() => setEditing(null)}
      />
    )
  }
  if (editingCat) {
    return (
      <CategoryEditor
        category={editingCat === 'new' ? null : editingCat}
        onClose={() => setEditingCat(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['resources', `Resources (${resources.length})`],
            ['categories', `Categories (${categories.length})`],
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

      {section === 'resources' && (
        <ResourcesList
          resources={resources}
          categories={categories}
          onNew={() => setEditing('new')}
          onEdit={setEditing}
        />
      )}
      {section === 'categories' && (
        <CategoriesList
          categories={categories}
          onNew={() => setEditingCat('new')}
          onEdit={setEditingCat}
        />
      )}
    </div>
  )
}

function ResourcesList({
  resources,
  categories,
  onNew,
  onEdit,
}: {
  resources: Resource[]
  categories: Category[]
  onNew: () => void
  onEdit: (r: Resource) => void
}) {
  const [isPending, startTransition] = useTransition()
  const categoriesById = new Map(categories.map((c) => [c.id, c]))

  const handleDelete = (id: string) => {
    if (!confirm('Delete this resource?')) return
    const fd = new FormData()
    fd.set('resource_id', id)
    startTransition(async () => {
      await deleteResource(fd)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={onNew}>+ Add resource</Button>
      </div>
      {resources.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No resources yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Audience</th>
                <th className="px-3 py-2 text-right">Downloads</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="text-display font-bold">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      <code>{r.slug}</code>
                    </p>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.category_id ? categoriesById.get(r.category_id)?.name ?? '—' : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs uppercase tracking-widest">
                    {r.audience}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {r.download_count.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.featured && (
                        <span className="text-display rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent">
                          Featured
                        </span>
                      )}
                      <span
                        className={`text-display rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                          r.published
                            ? 'bg-success/20 text-success'
                            : 'bg-panel-elevated text-muted-foreground'
                        }`}
                      >
                        {r.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(r)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(r.id)}
                      disabled={isPending}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ResourceEditor({
  resource,
  categories,
  onClose,
}: {
  resource: Resource | null
  categories: Category[]
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      const res = await upsertResource(fd)
      if (res.ok) onClose()
      else setError(res.message ?? 'Save failed')
    })
  }

  return (
    <form action={action} className="space-y-4">
      {resource?.id && <input type="hidden" name="resource_id" value={resource.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={resource?.title} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={resource?.description ?? ''}
            rows={3}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={resource?.category_id ?? ''}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="audience">Audience</Label>
          <select
            id="audience"
            name="audience"
            defaultValue={resource?.audience ?? 'all'}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="all">Everyone</option>
            <option value="talent">Talent only</option>
            <option value="brand">Brands only</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="file_url">File URL</Label>
          <Input id="file_url" name="file_url" type="url" defaultValue={resource?.file_url ?? ''} placeholder="https://… (PDF, etc.)" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="external_url">External URL (alternative to file)</Label>
          <Input id="external_url" name="external_url" type="url" defaultValue={resource?.external_url ?? ''} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="thumbnail_url">Thumbnail URL (optional)</Label>
          <Input id="thumbnail_url" name="thumbnail_url" type="url" defaultValue={resource?.thumbnail_url ?? ''} />
        </div>
        <label className="flex items-center gap-2 sm:col-span-1">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={resource?.featured ?? false}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Featured</span>
        </label>
        <label className="flex items-center gap-2 sm:col-span-1">
          <input
            type="checkbox"
            name="published"
            defaultChecked={resource?.published ?? true}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Published</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : resource ? 'Save resource' : 'Add resource'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function CategoriesList({
  categories,
  onNew,
  onEdit,
}: {
  categories: Category[]
  onNew: () => void
  onEdit: (c: Category) => void
}) {
  const [isPending, startTransition] = useTransition()
  const handleDelete = (id: string) => {
    if (!confirm('Delete this category? Resources in it will be unlinked.')) return
    const fd = new FormData()
    fd.set('category_id', id)
    startTransition(async () => {
      await deleteCategory(fd)
    })
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={onNew}>+ Add category</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{c.icon}</span>
              <p className="text-display font-bold">{c.name}</p>
            </div>
            {c.description && (
              <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <code>{c.slug}</code>
            </p>
            <div className="mt-3 flex gap-1">
              <Button size="sm" variant="outline" onClick={() => onEdit(c)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(c.id)}
                disabled={isPending}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryEditor({
  category,
  onClose,
}: {
  category: Category | null
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      const res = await upsertCategory(fd)
      if (res.ok) onClose()
      else setError(res.message ?? 'Save failed')
    })
  }

  return (
    <form action={action} className="space-y-4">
      {category?.id && <input type="hidden" name="category_id" value={category.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="c_name">Name</Label>
          <Input id="c_name" name="name" defaultValue={category?.name} required />
        </div>
        <div>
          <Label htmlFor="c_icon">Icon (emoji)</Label>
          <Input id="c_icon" name="icon" defaultValue={category?.icon ?? ''} maxLength={4} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="c_description">Description</Label>
          <textarea
            id="c_description"
            name="description"
            defaultValue={category?.description ?? ''}
            rows={2}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : category ? 'Save category' : 'Add category'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
