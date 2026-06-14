'use client'

import { useActionState, useState } from 'react'
import { createEpkShareLink, revokeEpkShareLink, type ShareLinkState } from '../share-actions'

type Link = {
  id: string
  token: string
  label: string | null
  recipient_email: string | null
  expires_at: string | null
  revoked_at: string | null
  view_count: number
  last_viewed_at: string | null
  created_at: string
}

export function SharePanel({
  epkId,
  publicUrl,
  shareLinks,
}: {
  epkId: string
  publicUrl: string
  shareLinks: Link[]
}) {
  const [showForm, setShowForm] = useState(false)
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Share + download</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Send a private magic link to media contacts, or get a PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`${publicUrl}?print=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
          >
            Print preview
          </a>
          <a
            href={`/api/epk/${epkId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Download PDF
          </a>
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <p className="text-display text-xs font-bold uppercase tracking-widest">Share links</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
        >
          {showForm ? 'Cancel' : '+ Create link'}
        </button>
      </div>

      {showForm && <NewLinkForm epkId={epkId} onCreated={() => setShowForm(false)} />}

      <div className="mt-3 space-y-2">
        {shareLinks.length === 0 && (
          <p className="rounded-[var(--radius-sm)] border border-dashed border-border bg-background/40 p-4 text-center text-xs text-muted-foreground">
            No share links yet. Create one to share privately with a contact.
          </p>
        )}
        {shareLinks.map((l) => (
          <LinkRow key={l.id} link={l} siteUrl={siteUrl} />
        ))}
      </div>
    </section>
  )
}

function NewLinkForm({ epkId, onCreated }: { epkId: string; onCreated: () => void }) {
  const [state, action, pending] = useActionState<ShareLinkState, FormData>(createEpkShareLink, {})
  if (state.ok) {
    queueMicrotask(onCreated)
  }
  return (
    <form action={action} className="mt-3 grid gap-3 rounded-[var(--radius-sm)] border border-border bg-background/40 p-3 sm:grid-cols-3">
      <input type="hidden" name="epk_id" value={epkId} />
      <input
        name="label"
        placeholder="Label (e.g. ESPN intern Sara)"
        className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2"
      />
      <input
        name="expires_in_days"
        type="number"
        min={1}
        max={365}
        placeholder="Expires in days"
        className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        type="email"
        name="recipient_email"
        placeholder="Email it directly (optional)"
        className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create link'}
      </button>
      {state.error && <p className="text-xs text-destructive sm:col-span-3">{state.error}</p>}
    </form>
  )
}

function LinkRow({ link, siteUrl }: { link: Link; siteUrl: string }) {
  const [copied, setCopied] = useState(false)
  const [revokeState, revokeAction, revokePending] = useActionState<ShareLinkState, FormData>(
    revokeEpkShareLink,
    {}
  )
  const url = `${siteUrl}/share/epk/${link.token}`
  const expired = link.expires_at && new Date(link.expires_at) < new Date()
  const revoked = Boolean(link.revoked_at)
  const status: { label: string; tone: string } = revoked
    ? { label: 'Revoked', tone: 'bg-destructive/20 text-destructive' }
    : expired
    ? { label: 'Expired', tone: 'bg-panel-elevated text-muted-foreground' }
    : { label: 'Active', tone: 'bg-success/20 text-success' }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-display truncate text-sm font-bold">
            {link.label ?? link.recipient_email ?? 'Untitled link'}
          </p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">{url}</p>
        </div>
        <span
          className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${status.tone}`}
        >
          {status.label}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span>{link.view_count} view{link.view_count === 1 ? '' : 's'}</span>
        {link.last_viewed_at && (
          <span>· last {new Date(link.last_viewed_at).toLocaleDateString()}</span>
        )}
        {link.expires_at && !expired && !revoked && (
          <span>· expires {new Date(link.expires_at).toLocaleDateString()}</span>
        )}
        <span className="flex-1" />
        {!revoked && !expired && (
          <>
            <button
              onClick={copy}
              className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <form action={revokeAction}>
              <input type="hidden" name="share_id" value={link.id} />
              <button
                type="submit"
                disabled={revokePending}
                className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive disabled:opacity-50"
              >
                {revokePending ? '…' : 'Revoke'}
              </button>
            </form>
          </>
        )}
      </div>
      {revokeState.error && <p className="mt-1 text-[10px] text-destructive">{revokeState.error}</p>}
    </div>
  )
}
