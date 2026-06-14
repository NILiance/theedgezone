'use client'

import { useActionState, useState } from 'react'
import { composePushMessage, type PushState } from '../push-actions'

export function PushComposer({ appId, primary }: { appId: string; primary: string }) {
  const [state, action, pending] = useActionState<PushState, FormData>(composePushMessage, {})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sendNow, setSendNow] = useState(true)

  return (
    <form action={action} className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <input type="hidden" name="app_id" value={appId} />
      <p className="text-eyebrow mb-3 text-primary">Compose</p>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Title</span>
            <input
              name="title"
              maxLength={100}
              required
              placeholder="Game day prediction 🏈"
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-bold"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Message</span>
            <textarea
              name="body"
              rows={3}
              maxLength={240}
              required
              placeholder="Drop in for the live stream at 7pm CT — telling y'all who I'm picking and why."
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? '− Hide' : '+ Advanced'} options
          </button>
          {showAdvanced && (
            <label className="block text-sm">
              <span className="block text-xs text-muted-foreground">
                Extra data (JSON object, available inside the app)
              </span>
              <textarea
                name="data"
                rows={3}
                placeholder='{ "screen": "stream", "streamId": "abc" }'
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
              />
            </label>
          )}
        </div>

        <div className="space-y-3">
          <PhonePreview primary={primary} />
          <div className="space-y-2 rounded-[var(--radius-sm)] border border-border bg-background/40 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="send_mode"
                value="now"
                checked={sendNow}
                onChange={() => setSendNow(true)}
                className="h-4 w-4"
              />
              Send immediately
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="send_mode"
                value="schedule"
                checked={!sendNow}
                onChange={() => setSendNow(false)}
                className="h-4 w-4"
              />
              Schedule for later
            </label>
            {!sendNow && (
              <input
                type="datetime-local"
                name="scheduled_for"
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm"
              />
            )}
            {sendNow && <input type="hidden" name="send_now" value="on" />}
          </div>
        </div>
      </div>

      {state.error && (
        <p className="mt-4 rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && state.delivered !== undefined && (
        <p className="mt-4 rounded-[var(--radius-sm)] border border-success/40 bg-success/5 p-3 text-sm text-success">
          Sent — delivered to {state.delivered}{' '}
          {state.failed && state.failed > 0 ? `(${state.failed} failed)` : ''}
        </p>
      )}
      {state.ok && state.delivered === undefined && (
        <p className="mt-4 rounded-[var(--radius-sm)] border border-success/40 bg-success/5 p-3 text-sm text-success">
          Scheduled.
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Sending…' : sendNow ? 'Send to all devices' : 'Schedule'}
        </button>
      </div>
    </form>
  )
}

function PhonePreview({ primary }: { primary: string }) {
  return (
    <div className="relative mx-auto h-[200px] w-full max-w-[240px] overflow-hidden rounded-[28px] border-4 border-foreground/80 bg-gradient-to-b from-slate-800 to-slate-900 p-3 shadow-elevated">
      <div className="rounded-xl bg-white/95 p-2 text-[10px] text-black shadow">
        <div className="flex items-center gap-1.5">
          <div
            className="h-4 w-4 rounded-[3px]"
            style={{ background: primary }}
          />
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
            Your app · now
          </span>
        </div>
        <p
          className="mt-1 text-[11px] font-bold leading-tight"
          id="push-preview-title"
        >
          Title preview
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-gray-700" id="push-preview-body">
          Message preview shows here as you type.
        </p>
      </div>
      <p className="mt-3 text-center text-[8px] uppercase tracking-widest text-white/40">
        Lock screen preview
      </p>
    </div>
  )
}
