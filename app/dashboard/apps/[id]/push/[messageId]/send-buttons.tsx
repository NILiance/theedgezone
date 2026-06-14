'use client'

import { useActionState } from 'react'
import { sendPushMessage, cancelPushMessage, type PushState } from '../../push-actions'

export function SendButtons({
  appId,
  messageId,
  status,
}: {
  appId: string
  messageId: string
  status: string
}) {
  const [sendState, sendAction, sendPending] = useActionState<PushState, FormData>(sendPushMessage, {})
  const [cancelState, cancelAction, cancelPending] = useActionState<PushState, FormData>(cancelPushMessage, {})

  if (status === 'sent' || status === 'cancelled' || status === 'failed') {
    return null
  }
  return (
    <div className="flex flex-wrap gap-3">
      <form action={sendAction}>
        <input type="hidden" name="app_id" value={appId} />
        <input type="hidden" name="message_id" value={messageId} />
        <button
          type="submit"
          disabled={sendPending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {sendPending ? 'Sending…' : 'Send now'}
        </button>
      </form>
      <form action={cancelAction}>
        <input type="hidden" name="app_id" value={appId} />
        <input type="hidden" name="message_id" value={messageId} />
        <button
          type="submit"
          disabled={cancelPending}
          className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-bold uppercase tracking-widest text-destructive disabled:opacity-50"
        >
          {cancelPending ? 'Cancelling…' : 'Cancel'}
        </button>
      </form>
      {sendState.error && <p className="w-full text-sm text-destructive">{sendState.error}</p>}
      {cancelState.error && <p className="w-full text-sm text-destructive">{cancelState.error}</p>}
      {sendState.ok && sendState.delivered !== undefined && (
        <p className="w-full text-sm text-success">
          Delivered to {sendState.delivered}
          {sendState.failed && sendState.failed > 0 ? ` (${sendState.failed} failed)` : ''}
        </p>
      )}
    </div>
  )
}
