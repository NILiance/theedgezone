'use client'

import { Component, type ReactNode } from 'react'

/**
 * Catches render/SSR errors in a subtree and shows the actual message inline
 * instead of nuking the whole route to the generic "That hit an error" page.
 *
 * Why a client boundary that prints the message: Next's route-level error.tsx
 * only receives a sanitized digest in production, so it can't tell us WHAT
 * broke. A user-defined client boundary keeps `error.message`, so we surface
 * it on screen (and to the server console / Vercel logs) — turning an opaque
 * digest into something diagnosable, while keeping the rest of the page alive.
 */
export class RenderBoundary extends Component<
  { label: string; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(`[render-boundary:${this.props.label}]`, error?.message, error?.stack)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-5">
          <p className="text-eyebrow text-destructive">{this.props.label} hit an error</p>
          <p className="mt-2 break-words text-sm text-foreground">
            {error.message || 'Unknown render error'}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Screenshot this message and send it over — it pins the exact cause.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
