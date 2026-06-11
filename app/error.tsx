'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error.tsx]', error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="text-eyebrow text-destructive">Something went wrong</p>
        <h1 className="text-display mt-3 text-3xl font-black tracking-tight">
          That page hit an error.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred.'}
          {error.digest && (
            <span className="mt-2 block font-mono text-xs text-muted-foreground/70">
              digest: {error.digest}
            </span>
          )}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/dashboard">
            <Button variant="outline">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
