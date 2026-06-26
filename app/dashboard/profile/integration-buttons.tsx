'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { connectNiliance, syncFromNiliance } from './actions'

/** "Connect" button for the NILiance card — runs the bridge link on demand. */
export function NilianceConnectButton() {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const go = () => {
    setMsg(null)
    start(async () => {
      const res = await connectNiliance()
      setMsg({ ok: res.ok, text: res.message })
    })
  }

  return (
    <div className="mt-4">
      <Button size="sm" onClick={go} disabled={pending}>
        {pending ? 'Connecting…' : 'Connect'}
      </Button>
      {msg && (
        <p className={`mt-2 text-xs ${msg.ok ? 'text-success' : 'text-muted-foreground'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}

/** "Sync from NILiance" — pulls profile data from the linked NILiance account. */
export function NilianceSyncButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const go = () => {
    setMsg(null)
    start(async () => {
      const res = await syncFromNiliance()
      setMsg({ ok: res.ok, text: res.message })
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="mt-4">
      <Button size="sm" variant="outline" onClick={go} disabled={pending}>
        {pending ? 'Syncing…' : '↓ Sync from NILiance'}
      </Button>
      {msg && (
        <p className={`mt-2 text-xs ${msg.ok ? 'text-success' : 'text-muted-foreground'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}

/** Preview + Copy Link for the public profile (/t/<slug>). */
export function PublicProfileButtons({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)

  if (!slug) {
    return (
      <p className="mt-4 text-xs text-muted-foreground">
        Add your name above and save — then your public link turns on here.
      </p>
    )
  }

  const path = `/t/${slug}`
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked — fall back to a prompt the user can copy from.
      window.prompt('Copy your public profile link:', fullUrl)
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <a href={path} target="_blank" rel="noreferrer">
        <Button size="sm" variant="outline">
          Preview
        </Button>
      </a>
      <Button size="sm" variant="outline" onClick={copy}>
        {copied ? 'Copied ✓' : 'Copy Link'}
      </Button>
    </div>
  )
}
