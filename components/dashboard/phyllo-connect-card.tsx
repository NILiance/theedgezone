'use client'

import { useState } from 'react'
import Script from 'next/script'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    PhylloConnect?: {
      initialize(config: Record<string, unknown>): {
        on: (event: string, cb: (payload: unknown) => void) => void
        open: () => void
      }
    }
  }
}

export function PhylloConnectCard({
  connected,
  connectedAt,
}: {
  connected: boolean
  connectedAt: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justConnected, setJustConnected] = useState(false)

  async function connect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/phyllo/token', { method: 'POST' })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const { sdkToken, phylloUserId, environment } = (await res.json()) as {
        sdkToken: string
        phylloUserId: string
        environment: string
      }
      if (!window.PhylloConnect) {
        throw new Error('Phyllo Connect SDK not loaded')
      }
      const cfg = window.PhylloConnect.initialize({
        clientDisplayName: 'Edge Zone',
        environment,
        userId: phylloUserId,
        token: sdkToken,
      })
      cfg.on('accountConnected', () => {
        setJustConnected(true)
        fetch('/api/phyllo/connected', { method: 'POST' }).catch(() => {})
      })
      cfg.on('exit', () => setLoading(false))
      cfg.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Phyllo error')
      setLoading(false)
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect all social accounts? Your imported data stays on file.')) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/phyllo/token', { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Phyllo error')
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://cdn.getphyllo.com/connect/v2/phyllo-connect.js" strategy="lazyOnload" />
      <div className="rounded-[var(--radius)] border border-border bg-panel/60 p-6 shadow-elevated">
        <p className="text-eyebrow text-primary">Connect socials</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {connected || justConnected
            ? 'Connected — Edge Zone can import follower counts, engagement, and verified handles.'
            : 'Securely link Instagram, TikTok, YouTube, Twitter / X, and more via Phyllo. Read-only access — we only see public profile data and engagement.'}
        </p>
        {connectedAt && !justConnected && (
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            Connected {new Date(connectedAt).toLocaleDateString()}
          </p>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {connected || justConnected ? (
            <>
              <Button size="sm" variant="outline" onClick={connect} disabled={loading}>
                {loading ? 'Loading…' : 'Add another account'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={disconnect}
                disabled={loading}
                className="text-destructive"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={connect} disabled={loading}>
              {loading ? 'Loading…' : 'Connect socials'}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
