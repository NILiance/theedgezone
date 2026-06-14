'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import {
  sendBrandClientMagicLink,
  uploadBrandClientAsset,
  deleteBrandClientAsset,
} from '../actions'

interface Asset {
  id: string
  kind: string
  filename: string
  url: string
  size_bytes: number | null
  description: string | null
  created_at: string
}

interface Props {
  clientId: string
  assets: Asset[]
  recentTokens: Array<{
    token: string
    expires_at: string
    consumed_at: string | null
    created_at: string
  }>
}

export function ClientDetail({ clientId, assets, recentTokens }: Props) {
  const [isPending, startTransition] = useTransition()
  const [link, setLink] = useState<{ url: string; ok: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  const sendLink = (ttlDays: number) => {
    setError(null)
    setLink(null)
    const fd = new FormData()
    fd.set('client_id', clientId)
    fd.set('ttl_days', String(ttlDays))
    startTransition(async () => {
      const res = await sendBrandClientMagicLink(fd)
      if (res.ok && res.url) setLink({ url: res.url, ok: true })
      else setError(res.message ?? 'Failed to send')
    })
  }

  const addAsset = (fd: FormData) => {
    setUploadStatus(null)
    fd.set('client_id', clientId)
    startTransition(async () => {
      const res = await uploadBrandClientAsset(fd)
      setUploadStatus(res.ok ? 'Asset added.' : res.message ?? 'Failed')
    })
  }

  const removeAsset = (assetId: string) => {
    if (!confirm('Remove this asset from the client portal?')) return
    const fd = new FormData()
    fd.set('asset_id', assetId)
    startTransition(async () => {
      await deleteBrandClientAsset(fd)
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow mb-3 text-primary">Magic link</p>
        <p className="text-sm text-muted-foreground">
          Generates a new portal link and emails it to the client. Older links keep working until
          they expire.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => sendLink(14)} disabled={isPending}>
            {isPending ? 'Sending…' : 'Send 14-day link'}
          </Button>
          <Button variant="outline" onClick={() => sendLink(60)} disabled={isPending}>
            Send 60-day link
          </Button>
          <Button variant="outline" onClick={() => sendLink(180)} disabled={isPending}>
            Send 180-day link
          </Button>
        </div>
        {link && (
          <div className="mt-3 rounded-[var(--radius-sm)] border border-success/40 bg-success/5 p-3">
            <p className="text-sm text-success">Email sent. URL:</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">{link.url}</p>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {recentTokens.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Recent tokens ({recentTokens.length})
            </summary>
            <ul className="mt-2 space-y-1 text-xs">
              {recentTokens.map((t) => (
                <li key={t.token} className="font-mono text-muted-foreground">
                  {t.token.slice(0, 12)}… ·{' '}
                  {new Date(t.created_at).toLocaleDateString()} → expires{' '}
                  {new Date(t.expires_at).toLocaleDateString()}
                  {t.consumed_at && ' · consumed'}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow mb-3 text-primary">Add asset</p>
        <form action={addAsset} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <div>
              <Label htmlFor="filename">Filename</Label>
              <Input id="filename" name="filename" required placeholder="brand-guide.pdf" />
            </div>
            <div>
              <Label htmlFor="kind">Kind</Label>
              <select
                id="kind"
                name="kind"
                defaultValue="file"
                className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
              >
                <option value="file">File</option>
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
                <option value="brand_kit_zip">Brand Kit ZIP</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Upload</Label>
            <AssetUploader name="url" />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" name="description" />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Add asset'}
            </Button>
            {uploadStatus && <p className="text-xs text-success">{uploadStatus}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow mb-3 text-primary">Client assets ({assets.length})</p>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assets uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {assets.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-display font-bold hover:text-primary"
                  >
                    {a.filename}
                  </a>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {a.kind}
                    {a.size_bytes && ` · ${(a.size_bytes / 1024).toFixed(0)} KB`}
                    {' · added '}
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                  {a.description && (
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAsset(a.id)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/** Thin wrapper so the form field can hold a URL string after upload. */
function AssetUploader({ name }: { name: string }) {
  const [url, setUrl] = useState('')
  return (
    <>
      <input type="hidden" name={name} value={url} />
      <AssetPicker value={url} onChange={setUrl} />
    </>
  )
}
