'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Local error boundary for the admin section. Replaces the generic
 * "That page hit an error" so we can surface the real message + digest.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin]', error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-destructive">Admin</p>
        <h1 className="text-display mt-2 text-3xl font-black tracking-tight">
          That section hit an error
        </h1>
      </div>

      <div className="rounded-[var(--radius-md)] border border-destructive/40 bg-destructive/5 p-6">
        <p className="text-sm font-semibold text-destructive">
          {error.message || 'Unknown error'}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">digest: {error.digest}</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Most admin tools need a Supabase service role key. If you just deployed,
          verify that <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
          is set in Vercel and the deploy finished.
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
