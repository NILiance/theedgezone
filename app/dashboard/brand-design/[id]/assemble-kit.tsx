'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { assembleAndUploadKit } from '@/app/dashboard/brand-design/actions'

interface Props {
  brandId: string
  existingKitUrl: string | null
}

export function AssembleKitButton({ brandId, existingKitUrl }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(existingKitUrl)

  const assemble = () => {
    setError(null)
    const fd = new FormData()
    fd.set('brand_id', brandId)
    startTransition(async () => {
      const res = await assembleAndUploadKit(fd)
      if (res.ok && res.url) {
        setUrl(res.url)
      } else {
        setError(res.message ?? 'Assembly failed')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={assemble} disabled={isPending} size="sm">
        {isPending ? 'Assembling…' : url ? 'Rebuild kit' : 'Assemble brand kit'}
      </Button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-display rounded-[var(--radius-sm)] border border-success bg-success/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-success hover:bg-success/20"
        >
          ⬇ Download brand kit
        </a>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
