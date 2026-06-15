'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function BrandDesignError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[brand-design]', error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-destructive">Brand Design</p>
        <h1 className="text-display mt-2 text-3xl font-black tracking-tight">
          That hit an error
        </h1>
      </div>

      <div className="rounded-[var(--radius-md)] border border-destructive/40 bg-destructive/5 p-6">
        <p className="text-sm font-semibold text-destructive">
          {error.message || 'Unknown error'}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            digest: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Send the digest above so we can pull the trace from logs.
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={reset} size="sm">
          Try again
        </Button>
        <Link href="/dashboard">
          <Button size="sm" variant="ghost">
            Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
