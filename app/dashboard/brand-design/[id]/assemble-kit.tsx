'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { DownloadLink } from '@/components/download-link'
import { assembleAndUploadKit } from '@/app/dashboard/brand-design/actions'

interface Props {
  brandId: string
  existingKitUrl: string | null
  /** Error message from the auto-assemble at logo-finalize time. Persisted
   *  to brand_designs.brand_kit_error so the talent can see why the build
   *  silently failed instead of staring at a missing brand kit. */
  autoBuildError?: string | null
}

export function AssembleKitButton({ brandId, existingKitUrl, autoBuildError }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(existingKitUrl)
  // Local copy so we can clear it the moment a manual retry succeeds.
  const [persistedError, setPersistedError] = useState<string | null>(autoBuildError ?? null)

  const assemble = () => {
    setError(null)
    const fd = new FormData()
    fd.set('brand_id', brandId)
    startTransition(async () => {
      const res = await assembleAndUploadKit(fd)
      if (res.ok && res.url) {
        setUrl(res.url)
        setPersistedError(null)
      } else {
        setError(res.message ?? 'Assembly failed')
      }
    })
  }

  const showBanner = persistedError && !url

  return (
    <div className="flex flex-col gap-2">
      {showBanner && (
        <div className="rounded-[var(--radius-sm)] border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <p className="text-display font-bold uppercase tracking-widest">
            ⚠ Brand kit auto-build didn&rsquo;t finish
          </p>
          <p className="mt-1 break-words text-[11px] opacity-90">{persistedError}</p>
          <p className="mt-1 text-[11px] opacity-80">
            Click <strong>Retry build</strong> to try again. If it keeps failing, share this
            message with support so we can fix the root cause.
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={assemble} disabled={isPending} size="sm">
          {isPending
            ? 'Assembling…'
            : showBanner
              ? 'Retry build'
              : url
                ? 'Rebuild kit'
                : 'Assemble brand kit'}
        </Button>
        {url && (
          <DownloadLink
            url={url}
            filename="brand-kit.zip"
            className="text-display rounded-[var(--radius-sm)] border border-success bg-success/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-success hover:bg-success/20"
          >
            ⬇ Download brand kit
          </DownloadLink>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
