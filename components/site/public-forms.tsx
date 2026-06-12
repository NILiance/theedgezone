'use client'

import { useEffect, useState, useTransition } from 'react'
import type { ThemeTokens } from '@/lib/site-builder/theme-presets'
import {
  signGuestbook,
  voteOnPoll,
  captureEmail,
  submitContactForm,
} from '@/app/actions/site-public'

/**
 * Client-side forms that public visitors interact with on a rendered site.
 * Each submits to a public-callable server action and reflects success /
 * error inline.
 */

function buttonStyle(tokens: ThemeTokens): React.CSSProperties {
  return {
    background: tokens.primary,
    color: tokens.secondary,
    borderRadius: tokens.button_radius,
    fontFamily: tokens.font_heading,
  }
}

function inputStyle(tokens: ThemeTokens): React.CSSProperties {
  return {
    borderColor: tokens.border_color,
    background: tokens.bg_color,
    color: tokens.text_color,
  }
}

// ── Guestbook ──────────────────────────────────────────────────────────────

export function GuestbookForm({
  siteId,
  blockId,
  moderationRequired,
  tokens,
}: {
  siteId: string
  blockId?: string
  moderationRequired: boolean
  tokens: ThemeTokens
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const action = (fd: FormData) => {
    fd.set('site_id', siteId)
    if (blockId) fd.set('block_id', blockId)
    fd.set('moderation_required', moderationRequired ? 'true' : 'false')
    startTransition(async () => {
      const res = await signGuestbook(fd)
      setStatus({ ok: res.ok, message: res.message ?? '' })
    })
  }

  if (status?.ok) {
    return (
      <p className="text-sm" style={{ color: tokens.primary }}>
        {status.message || 'Thanks for signing.'}
      </p>
    )
  }

  return (
    <form action={action} className="space-y-3">
      <input
        name="display_name"
        placeholder="Your name"
        required
        maxLength={80}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      <textarea
        name="message"
        rows={3}
        placeholder="Leave a note…"
        required
        maxLength={1000}
        className="w-full rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      {status && !status.ok && (
        <p className="text-xs" style={{ color: '#dc2626' }}>
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-60"
        style={buttonStyle(tokens)}
      >
        {isPending ? 'Signing…' : 'Sign'}
      </button>
    </form>
  )
}

// ── Poll ───────────────────────────────────────────────────────────────────

function getVoterToken(): string {
  if (typeof window === 'undefined') return ''
  let t = window.localStorage.getItem('ez_voter_token')
  if (!t) {
    t = crypto.randomUUID()
    window.localStorage.setItem('ez_voter_token', t)
  }
  return t
}

export function PollForm({
  siteId,
  blockId,
  options,
  tokens,
}: {
  siteId: string
  blockId: string
  options: string[]
  tokens: ThemeTokens
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    setToken(getVoterToken())
  }, [])

  const vote = (option: string) => {
    setChosen(option)
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('block_id', blockId)
    fd.set('option_value', option)
    fd.set('voter_token', token)
    startTransition(async () => {
      const res = await voteOnPoll(fd)
      setStatus({ ok: res.ok, message: res.message ?? '' })
    })
  }

  return (
    <ul className="mt-3 space-y-2">
      {options.map((opt, i) => {
        const isPicked = chosen === opt
        return (
          <li key={i}>
            <button
              type="button"
              disabled={isPending || (status?.ok ?? false)}
              onClick={() => vote(opt)}
              className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition hover:opacity-90 disabled:opacity-60"
              style={{
                borderColor: isPicked ? tokens.primary : tokens.border_color,
                background: isPicked ? `${tokens.primary}20` : tokens.bg_color,
                color: tokens.text_color,
              }}
            >
              <span>{opt}</span>
              <span className="text-xs" style={{ color: tokens.muted_color }}>
                {isPicked ? (status?.ok ? '✓ Voted' : '…') : 'Vote →'}
              </span>
            </button>
          </li>
        )
      })}
      {status && (
        <p
          className="mt-2 text-xs"
          style={{ color: status.ok ? tokens.primary : '#dc2626' }}
        >
          {status.message}
        </p>
      )}
    </ul>
  )
}

// ── Email capture ─────────────────────────────────────────────────────────

export function EmailCaptureForm({
  siteId,
  buttonText,
  tokens,
}: {
  siteId: string
  buttonText: string
  tokens: ThemeTokens
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const action = (fd: FormData) => {
    fd.set('site_id', siteId)
    fd.set('source', 'email_capture_block')
    startTransition(async () => {
      const res = await captureEmail(fd)
      setStatus({ ok: res.ok, message: res.message ?? '' })
    })
  }

  if (status?.ok) {
    return (
      <p className="mt-4 text-center text-sm" style={{ color: tokens.primary }}>
        {status.message}
      </p>
    )
  }

  return (
    <form action={action} className="mt-6 flex flex-wrap gap-2">
      <input
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="min-w-0 flex-1 rounded-md border p-3 text-sm"
        style={inputStyle(tokens)}
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-60"
        style={buttonStyle(tokens)}
      >
        {isPending ? '…' : buttonText}
      </button>
      {status && !status.ok && (
        <p className="w-full text-xs" style={{ color: '#dc2626' }}>
          {status.message}
        </p>
      )}
    </form>
  )
}

// ── Contact form ──────────────────────────────────────────────────────────

export function ContactForm({
  siteId,
  blockId,
  fields,
  submitText,
  tokens,
}: {
  siteId: string
  blockId?: string
  fields: string[]
  submitText: string
  tokens: ThemeTokens
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const action = (fd: FormData) => {
    const payload: Record<string, string> = {}
    for (const f of fields) {
      const v = fd.get(f)
      if (typeof v === 'string') payload[f] = v
    }
    const submission = new FormData()
    submission.set('site_id', siteId)
    if (blockId) submission.set('block_id', blockId)
    submission.set('payload', JSON.stringify(payload))
    startTransition(async () => {
      const res = await submitContactForm(submission)
      setStatus({ ok: res.ok, message: res.message ?? '' })
    })
  }

  if (status?.ok) {
    return (
      <p className="text-sm" style={{ color: tokens.primary }}>
        {status.message}
      </p>
    )
  }

  return (
    <form action={action} className="space-y-3">
      {fields.map((name) =>
        name === 'message' ? (
          <textarea
            key={name}
            name={name}
            rows={5}
            placeholder="Your message…"
            required
            className="w-full rounded-md border p-3 text-sm"
            style={inputStyle(tokens)}
          />
        ) : (
          <input
            key={name}
            type={name === 'email' ? 'email' : 'text'}
            name={name}
            placeholder={name.charAt(0).toUpperCase() + name.slice(1)}
            required={name === 'email' || name === 'name'}
            className="w-full rounded-md border p-3 text-sm"
            style={inputStyle(tokens)}
          />
        )
      )}
      {status && !status.ok && (
        <p className="text-xs" style={{ color: '#dc2626' }}>
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-60"
        style={buttonStyle(tokens)}
      >
        {isPending ? '…' : submitText}
      </button>
    </form>
  )
}
