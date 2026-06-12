'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { upsertGallery, deleteGallery } from '@/app/dashboard/sites/actions'

interface Image {
  url: string
  alt?: string
}

interface Gallery {
  id: string
  name: string
  images: Image[]
}

interface Props {
  siteId: string
  galleries: Gallery[]
}

export function GalleriesTab({ siteId, galleries }: Props) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)

  if (editingId) {
    const existing = editingId === 'new' ? null : galleries.find((g) => g.id === editingId)
    return (
      <GalleryEditor
        siteId={siteId}
        gallery={existing ?? null}
        onClose={() => setEditingId(null)}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Named galleries are reusable across pages. Add a gallery here, then point a Gallery
            block at it via its <code className="rounded bg-muted px-1">gallery_source</code> field.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditingId('new')}>
          + New gallery
        </Button>
      </div>

      {galleries.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No galleries yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((g) => (
            <GalleryCard
              key={g.id}
              gallery={g}
              onEdit={() => setEditingId(g.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function GalleryCard({ gallery, onEdit }: { gallery: Gallery; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition()
  const handleDelete = () => {
    if (!confirm(`Delete "${gallery.name}" and its image list? (The image files stay in storage.)`))
      return
    const fd = new FormData()
    fd.set('gallery_id', gallery.id)
    startTransition(async () => {
      try {
        await deleteGallery(fd)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete')
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
      <div className="grid grid-cols-3 gap-0.5 bg-background">
        {gallery.images.slice(0, 6).map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={img.url}
            alt={img.alt ?? ''}
            className="aspect-square h-auto w-full object-cover"
          />
        ))}
        {gallery.images.length === 0 && (
          <div className="col-span-3 aspect-[3/1] bg-panel-elevated/50" />
        )}
      </div>
      <div className="p-3">
        <p className="text-display text-sm font-bold">{gallery.name}</p>
        <p className="text-xs text-muted-foreground">{gallery.images.length} images</p>
        <div className="mt-3 flex gap-1">
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function GalleryEditor({
  siteId,
  gallery,
  onClose,
}: {
  siteId: string
  gallery: Gallery | null
  onClose: () => void
}) {
  const [name, setName] = useState(gallery?.name ?? '')
  const [images, setImages] = useState<Image[]>(gallery?.images ?? [])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    setError(null)
    const fd = new FormData()
    fd.set('site_id', siteId)
    if (gallery?.id) fd.set('gallery_id', gallery.id)
    fd.set('name', name)
    fd.set('images', JSON.stringify(images))
    startTransition(async () => {
      try {
        await upsertGallery(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  const update = (idx: number, patch: Partial<Image>) =>
    setImages(images.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  const remove = (idx: number) => setImages(images.filter((_, i) => i !== idx))
  const add = () => setImages([...images, { url: '', alt: '' }])
  const move = (idx: number, direction: 'up' | 'down') => {
    const next = [...images]
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= next.length) return
    const item = next[idx]!
    next[idx] = next[target]!
    next[target] = item
    setImages(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={onClose}>
          ← Back
        </Button>
        <p className="text-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {gallery ? 'Edit gallery' : 'New gallery'}
        </p>
      </div>

      <div>
        <Label htmlFor="gallery_name">Gallery name</Label>
        <Input
          id="gallery_name"
          defaultValue={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Game day"
        />
      </div>

      <div className="space-y-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="rounded-[var(--radius-sm)] border border-border bg-panel/40 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-eyebrow text-muted-foreground">Image #{idx + 1}</p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(idx, 'up')}
                  disabled={idx === 0}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(idx, 'down')}
                  disabled={idx === images.length - 1}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(idx)}
                  className="text-destructive"
                >
                  Remove
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <AssetPicker
                value={img.url}
                onChange={(url) => update(idx, { url })}
                siteId={siteId}
              />
            </div>
            <div className="mt-2">
              <Label>Alt text</Label>
              <Input
                defaultValue={img.alt ?? ''}
                onChange={(e) => update(idx, { alt: e.target.value })}
                placeholder="Description for accessibility"
              />
            </div>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={add}>
          + Add image
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 border-t border-border pt-4">
        <Button onClick={save} disabled={isPending || !name.trim()}>
          {isPending ? 'Saving…' : gallery ? 'Save gallery' : 'Create gallery'}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
