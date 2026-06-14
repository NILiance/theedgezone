'use client'

import { useEffect, useState, useTransition } from 'react'
import type { ThemeTokens } from '@/lib/site-builder/theme-presets'

/**
 * Client-side checkout launchers used by the public-site block renderers.
 * Each component POSTs to /api/site-checkout, gets back a Stripe Checkout
 * Session URL, and redirects the browser to it.
 *
 * Reads the ?ref=code affiliate query param off the current URL and
 * forwards it as `affiliate_code` so attribution lands on the
 * transaction record.
 */

function buttonStyle(tokens: ThemeTokens, full = false): React.CSSProperties {
  return {
    background: tokens.primary,
    color: tokens.secondary,
    borderRadius: tokens.button_radius,
    fontFamily: tokens.font_heading,
    width: full ? '100%' : undefined,
  }
}

function inputStyle(tokens: ThemeTokens): React.CSSProperties {
  return {
    borderColor: tokens.border_color,
    background: tokens.bg_color,
    color: tokens.text_color,
  }
}

function getAffiliateCode(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const url = new URL(window.location.href)
  const ref = url.searchParams.get('ref')
  if (ref) return ref
  try {
    const stored = localStorage.getItem('ez_ref')
    return stored ?? undefined
  } catch {
    return undefined
  }
}

async function launchCheckout(body: Record<string, unknown>): Promise<string | null> {
  const res = await fetch('/api/site-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.url ?? null
}

// ── Tip jar ────────────────────────────────────────────────────────────────

export function TipJarCheckout({
  siteId,
  blockId,
  amounts,
  allowCustom,
  tokens,
}: {
  siteId: string
  blockId: string
  amounts: number[]
  allowCustom: boolean
  tokens: ThemeTokens
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  const [custom, setCustom] = useState<string>('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    const customAmount = Number(custom)
    const amountCents =
      chosen !== null
        ? Math.round(chosen * 100)
        : custom && customAmount > 0
        ? Math.round(customAmount * 100)
        : 0
    if (amountCents < 100) {
      setError('Pick an amount of at least $1.')
      return
    }
    startTransition(async () => {
      try {
        const url = await launchCheckout({
          kind: 'tip',
          site_id: siteId,
          block_id: blockId,
          amount_cents: amountCents,
          buyer_name: name || undefined,
          buyer_email: email || undefined,
          message: message || undefined,
          affiliate_code: getAffiliateCode(),
        })
        if (url) window.location.href = url
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {amounts.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => {
              setChosen(amt)
              setCustom('')
            }}
            className="rounded-md px-4 py-3 text-sm font-bold transition hover:opacity-90"
            style={{
              ...buttonStyle(tokens),
              outline: chosen === amt ? `2px solid ${tokens.accent}` : undefined,
            }}
          >
            ${amt}
          </button>
        ))}
      </div>
      {allowCustom && (
        <input
          type="number"
          inputMode="numeric"
          placeholder="Custom amount"
          value={custom}
          min={1}
          onChange={(e) => {
            setCustom(e.target.value)
            setChosen(null)
          }}
          className="w-full rounded-md border p-3 text-sm"
          style={inputStyle(tokens)}
        />
      )}
      <input
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      <input
        type="email"
        placeholder="Email (for receipt, optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      <textarea
        rows={2}
        placeholder="Add a note (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-60"
        style={buttonStyle(tokens, true)}
      >
        {isPending ? 'Loading checkout…' : 'Send tip'}
      </button>
    </div>
  )
}

// ── Merch ─────────────────────────────────────────────────────────────────

export function MerchBuyButton({
  siteId,
  productId,
  label,
  tokens,
}: {
  siteId: string
  productId: string
  label: string
  tokens: ThemeTokens
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const buy = () => {
    setError(null)
    startTransition(async () => {
      try {
        const url = await launchCheckout({
          kind: 'merch',
          site_id: siteId,
          product_id: productId,
          affiliate_code: getAffiliateCode(),
        })
        if (url) window.location.href = url
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed')
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={buy}
        disabled={isPending}
        className="w-full rounded-md px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-60"
        style={buttonStyle(tokens)}
      >
        {isPending ? '…' : label}
      </button>
      {error && <p className="mt-1 text-[10px]" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}

// ── Membership tier ───────────────────────────────────────────────────────

export function TierJoinButton({
  siteId,
  tierId,
  label,
  tokens,
}: {
  siteId: string
  tierId: string
  label: string
  tokens: ThemeTokens
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    if (!email) {
      setError('Email required for membership.')
      return
    }
    startTransition(async () => {
      try {
        const url = await launchCheckout({
          kind: 'tier',
          site_id: siteId,
          tier_id: tierId,
          buyer_email: email,
          buyer_name: name || undefined,
          affiliate_code: getAffiliateCode(),
        })
        if (url) window.location.href = url
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-md px-4 py-2 text-sm font-bold uppercase tracking-widest"
        style={buttonStyle(tokens)}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="mt-4 space-y-2">
      <input
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border p-2 text-xs"
        style={inputStyle(tokens)}
      />
      <input
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border p-2 text-xs"
        style={inputStyle(tokens)}
      />
      {error && <p className="text-[10px]" style={{ color: '#dc2626' }}>{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !email}
        className="w-full rounded-md px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-60"
        style={buttonStyle(tokens)}
      >
        {isPending ? '…' : 'Continue to checkout'}
      </button>
    </div>
  )
}

// ── Shoutout ──────────────────────────────────────────────────────────────

export function ShoutoutForm({
  siteId,
  blockId,
  priceCents,
  label,
  tokens,
}: {
  siteId: string
  blockId: string
  priceCents: number
  label: string
  tokens: ThemeTokens
}) {
  const [open, setOpen] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    if (!name || !email || !message) {
      setError('Name, email, and message are required.')
      return
    }
    startTransition(async () => {
      try {
        const url = await launchCheckout({
          kind: 'shoutout',
          site_id: siteId,
          block_id: blockId,
          amount_cents: priceCents,
          buyer_name: name,
          buyer_email: email,
          message,
          recipient_name: recipient || undefined,
          affiliate_code: getAffiliateCode(),
        })
        if (url) window.location.href = url
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest"
        style={buttonStyle(tokens)}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="mt-4 space-y-2">
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      <input
        placeholder="Who's it for? (optional)"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      <textarea
        rows={3}
        placeholder="What should they say?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="w-full rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-60"
        style={buttonStyle(tokens)}
      >
        {isPending ? 'Loading checkout…' : `Continue to pay $${(priceCents / 100).toFixed(2)}`}
      </button>
    </div>
  )
}

// ── ?ref=code cookie persistence ──────────────────────────────────────────

export function AffiliateRefCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const ref = url.searchParams.get('ref')
      if (ref) {
        localStorage.setItem('ez_ref', ref)
        document.cookie = `ez_ref=${encodeURIComponent(ref)}; max-age=${60 * 60 * 24 * 90}; path=/; samesite=lax`
      }
    } catch {
      /* swallow */
    }
  }, [])
  return null
}
