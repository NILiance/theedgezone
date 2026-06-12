'use client'

import { useRef, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uploadAsset } from '@/app/dashboard/sites/actions'

interface Props {
  value: string
  onChange: (url: string) => void
  siteId?: string
  placeholder?: string
  accept?: string
}

/**
 * Picker that combines a plain URL field with an "Upload" button.
 * On upload, the file is sent to the `site-assets` Supabase Storage bucket
 * via the uploadAsset server action, and the returned public URL is set
 * on the field.
 */
export function AssetPicker({ value, onChange, siteId, placeholder, accept = 'image/*,video/*' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string>(value)

  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          defaultValue={value}
          onChange={(e) => {
            onChange(e.target.value)
            setPreview(e.target.value)
          }}
          placeholder={placeholder ?? 'https://… or click Upload'}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onPicked}
          className="hidden"
        />
      </div>
      {preview && /\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/i.test(preview) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="h-24 w-auto rounded-[var(--radius-sm)] border border-border object-cover"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
