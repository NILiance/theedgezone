'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  startConnectOnboarding,
  openExpressDashboard,
  syncConnectStatus,
} from './actions'

interface Props {
  hasAccount: boolean
  isActive: boolean
}

export function ConnectActions({ hasAccount, isActive }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onOnboard = () => {
    setError(null)
    startTransition(async () => {
      const res = await startConnectOnboarding()
      if (res.ok && res.url) window.location.href = res.url
      else setError(res.message ?? 'Failed to start onboarding')
    })
  }

  const onDashboard = () => {
    setError(null)
    startTransition(async () => {
      const res = await openExpressDashboard()
      if (res.ok && res.url) window.open(res.url, '_blank', 'noopener,noreferrer')
      else setError(res.message ?? 'Failed to open dashboard')
    })
  }

  const onSync = () => {
    setError(null)
    startTransition(async () => {
      const res = await syncConnectStatus()
      if (!res.ok) setError(res.message ?? 'Failed to sync')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isActive && (
        <Button onClick={onOnboard} disabled={isPending}>
          {isPending ? 'Loading…' : hasAccount ? 'Resume onboarding' : 'Set up payouts'}
        </Button>
      )}
      {hasAccount && (
        <Button onClick={onSync} disabled={isPending} variant="outline" size="sm">
          {isPending ? '…' : 'Refresh status'}
        </Button>
      )}
      {isActive && (
        <Button onClick={onDashboard} disabled={isPending} variant="outline" size="sm">
          Open Stripe Dashboard ↗
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
