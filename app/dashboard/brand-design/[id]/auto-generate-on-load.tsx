'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateConceptsAction } from './generate-actions'

/**
 * Auto-fires the initial 20-concept generation when the talent lands on
 * a freshly-purchased additional brand. Triggered by ?initial=1 in the
 * URL. The brand is presumed to have 0 concepts; we wait for the action
 * to complete then strip the flag and refresh so the page re-renders
 * with the new concepts visible.
 *
 * UI: a large pulsing card with copy that mirrors the legacy "Setting
 * up your new brand…" experience so the talent knows what's happening
 * during the 30-60s render.
 */
export function AutoGenerateOnLoad({
  brandId,
  conceptsCount,
}: {
  brandId: string
  conceptsCount: number
}) {
  const router = useRouter()
  const [stage, setStage] = useState<'starting' | 'rendering' | 'done' | 'failed'>(
    'starting'
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Already has concepts — strip the flag and let the studio render
    // normally without re-firing.
    if (conceptsCount > 0) {
      router.replace(`/dashboard/brand-design/${brandId}`)
      return
    }
    let cancelled = false
    const swap = setTimeout(() => {
      if (!cancelled) setStage('rendering')
    }, 1500)
    ;(async () => {
      try {
        const fd = new FormData()
        fd.set('brand_id', brandId)
        fd.set('round', '1')
        fd.set('count', '20')
        const res = await generateConceptsAction({}, fd)
        if (cancelled) return
        clearTimeout(swap)
        if (res?.error) {
          setError(res.error)
          setStage('failed')
          return
        }
        setStage('done')
        router.replace(`/dashboard/brand-design/${brandId}`)
        router.refresh()
      } catch (e) {
        if (cancelled) return
        clearTimeout(swap)
        setError(e instanceof Error ? e.message : 'Could not start generation')
        setStage('failed')
      }
    })()
    return () => {
      cancelled = true
      clearTimeout(swap)
    }
  }, [brandId, conceptsCount, router])

  return (
    <div className="rounded-[var(--radius)] border border-primary/40 bg-primary/5 p-8 text-center shadow-elevated">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
          <span className="absolute inset-1 animate-spin rounded-full border-4 border-primary/80 border-t-transparent" />
        </div>
      </div>
      {stage === 'starting' && (
        <>
          <p className="text-display text-2xl font-black text-primary">
            Setting up your new brand…
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Locking in your brand preferences and queuing 20 logo concepts.
          </p>
        </>
      )}
      {stage === 'rendering' && (
        <>
          <p className="text-display text-2xl font-black text-primary">
            Generating 20 concepts…
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Our designer is rendering each one — this usually takes 30–60 seconds. Stay on
            this page.
          </p>
        </>
      )}
      {stage === 'done' && (
        <>
          <p className="text-display text-2xl font-black text-success">
            ✓ Concepts ready
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Reloading…
          </p>
        </>
      )}
      {stage === 'failed' && (
        <>
          <p className="text-display text-xl font-black text-destructive">
            Couldn&rsquo;t auto-generate
          </p>
          <p className="mt-2 text-sm text-destructive break-words">{error}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Scroll down, edit your preferences, and click <strong>Save &amp; Generate</strong>.
          </p>
          <button
            type="button"
            onClick={() => router.replace(`/dashboard/brand-design/${brandId}`)}
            className="text-display mt-4 rounded-[var(--radius-sm)] border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-widest"
          >
            Continue manually
          </button>
        </>
      )}
    </div>
  )
}
