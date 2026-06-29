'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uploadAsset, listAssets, deleteAsset, generateImageAsset } from '@/app/dashboard/sites/actions'

interface Asset {
  id: string
  url: string
  path: string
  filename: string | null
  mime_type: string | null
}

interface Props {
  value: string
  onChange: (url: string) => void
  siteId?: string
  placeholder?: string
  accept?: string
  /** Show the "Generate image" option. Off for places like print proofs where
   *  you only want to pick/upload an existing logo. Default on. */
  allowGenerate?: boolean
}

/**
 * Primary asset picker.
 * - Drop a file (or click) to upload directly to the `site-assets` bucket.
 * - "Browse uploads" opens a thumbnail grid of everything you've uploaded
 *   so you can reuse assets without re-uploading.
 * - Paste URL remains under the advanced toggle for external images.
 */
export function AssetPicker({
  value,
  onChange,
  siteId,
  placeholder,
  accept = 'image/*,video/*',
  allowGenerate = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string>(value)
  const [dragOver, setDragOver] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)

  useEffect(() => {
    setPreview(value)
  }, [value])

  const handleFile = (file: File) => {
    setError(null)
    const fd = new FormData()
    if (siteId) fd.set('site_id', siteId)
    fd.set('file', file)
    startTransition(async () => {
      try {
        const { url } = await uploadAsset(fd)
        onChange(url)
        setPreview(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const looksLikeImage = preview && /\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/i.test(preview)
  const looksLikeVideo = preview && /\.(mp4|webm|mov)(\?|$)/i.test(preview)

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="rounded-[var(--radius-sm)] border border-border bg-panel/30 p-2">
          <div className="flex items-start gap-3">
            {looksLikeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-24 w-24 flex-shrink-0 rounded-[var(--radius-sm)] border border-border object-cover"
              />
            ) : looksLikeVideo ? (
              <video
                src={preview}
                className="h-24 w-24 flex-shrink-0 rounded-[var(--radius-sm)] border border-border object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-panel-elevated/40 text-xs text-muted-foreground">
                ?
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="break-all text-xs text-muted-foreground">{preview}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={isPending}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setBrowseOpen(true)}
                  disabled={isPending}
                >
                  Browse uploads
                </Button>
                {allowGenerate && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setGenerateOpen(true)}
                    disabled={isPending}
                  >
                    Generate
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onChange('')
                    setPreview('')
                  }}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-sm)] border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border bg-panel/20 hover:border-primary/40 hover:bg-panel/40'
          }`}
        >
          <p className="text-display text-sm font-bold text-foreground">
            {isPending ? 'Uploading…' : dragOver ? 'Drop to upload' : 'Drop a file or click to upload'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, WebP, GIF, SVG, MP4, WebM · 10 MB max
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setBrowseOpen(true) }}>
              Browse uploads
            </Button>
            {allowGenerate && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setGenerateOpen(true)
                }}
              >
                Generate from description
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setShowUrl((s) => !s)
              }}
            >
              {showUrl ? 'Hide URL field' : 'Paste URL'}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onPicked}
        className="hidden"
      />

      {showUrl && (
        <Input
          defaultValue={value}
          onChange={(e) => {
            onChange(e.target.value)
            setPreview(e.target.value)
          }}
          placeholder={placeholder ?? 'https://…'}
          className="text-xs"
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {browseOpen && (
        <BrowseUploads
          siteId={siteId}
          onPick={(url) => {
            onChange(url)
            setPreview(url)
            setBrowseOpen(false)
          }}
          onClose={() => setBrowseOpen(false)}
        />
      )}

      {generateOpen && (
        <GenerateImage
          siteId={siteId}
          onCreated={(url) => {
            onChange(url)
            setPreview(url)
            setGenerateOpen(false)
          }}
          onClose={() => setGenerateOpen(false)}
        />
      )}
    </div>
  )
}

function GenerateImage({
  siteId,
  onCreated,
  onClose,
}: {
  siteId?: string
  onCreated: (url: string) => void
  onClose: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState<'1x1' | '16x9' | '9x16' | '4x3' | '3x4'>('16x9')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (prompt.trim().length < 5) {
      setError('Describe what you want in at least 5 characters')
      return
    }
    setError(null)
    const fd = new FormData()
    if (siteId) fd.set('site_id', siteId)
    fd.set('prompt', prompt)
    fd.set('aspect_ratio', aspect)
    startTransition(async () => {
      try {
        const { url } = await generateImageAsset(fd)
        onCreated(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-eyebrow text-primary">Generate image</p>
            <p className="text-display text-lg font-bold">Describe what you want</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>
            Close
          </Button>
        </div>
        <div className="space-y-4 p-5">
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Description</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Stadium tunnel shot from behind, athlete walking out into the field at dusk, dramatic lighting, photo-realistic"
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm leading-relaxed"
              disabled={pending}
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Aspect ratio</span>
            <select
              value={aspect}
              onChange={(e) =>
                setAspect(e.target.value as '1x1' | '16x9' | '9x16' | '4x3' | '3x4')
              }
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
              disabled={pending}
            >
              <option value="16x9">Wide (16:9) — hero banners</option>
              <option value="1x1">Square (1:1) — thumbnails</option>
              <option value="9x16">Tall (9:16) — phone wallpapers</option>
              <option value="4x3">Landscape (4:3)</option>
              <option value="3x4">Portrait (3:4)</option>
            </select>
          </label>
          {error && (
            <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
              {error}
            </p>
          )}
          {pending && (
            <p className="text-xs text-muted-foreground">
              Generating… this usually takes 5–15 seconds.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={submit} disabled={pending}>
              {pending ? 'Generating…' : 'Generate image'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BrowseUploads({
  siteId,
  onPick,
  onClose,
}: {
  siteId?: string
  onPick: (url: string) => void
  onClose: () => void
}) {
  const [assets, setAssets] = useState<Asset[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, startTransition] = useTransition()

  useEffect(() => {
    let alive = true
    listAssets(siteId)
      .then((res) => {
        if (alive) setAssets(res)
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load')
      })
    return () => {
      alive = false
    }
  }, [siteId])

  const removeAsset = (asset: Asset) => {
    if (!confirm(`Delete ${asset.filename ?? 'this asset'}? Blocks already using it will break.`))
      return
    const fd = new FormData()
    fd.set('path', asset.path)
    startTransition(async () => {
      try {
        await deleteAsset(fd)
        setAssets((curr) => (curr ?? []).filter((a) => a.id !== asset.id))
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-eyebrow text-primary">Media library</p>
            <p className="text-display text-lg font-bold">Your uploads</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {assets === null && !error && (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {assets && assets.length === 0 && (
            <p className="rounded-[var(--radius-sm)] border border-dashed border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
              No uploads yet. Drop a file in any image field to start.
            </p>
          )}
          {assets && assets.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {assets.map((a) => {
                const isImage = (a.mime_type ?? '').startsWith('image/')
                return (
                  <div
                    key={a.id}
                    className="group relative overflow-hidden rounded-[var(--radius-sm)] border border-border bg-panel/40"
                  >
                    <button
                      type="button"
                      onClick={() => onPick(a.url)}
                      className="block w-full"
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.url}
                          alt={a.filename ?? ''}
                          className="aspect-square h-auto w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-panel-elevated/50 text-xs text-muted-foreground">
                          {a.mime_type?.split('/')[0] ?? 'file'}
                        </div>
                      )}
                    </button>
                    <p className="truncate border-t border-border bg-panel-elevated/40 px-2 py-1 text-[10px] text-muted-foreground">
                      {a.filename ?? a.path.split('/').pop()}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeAsset(a)}
                      disabled={isDeleting}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
