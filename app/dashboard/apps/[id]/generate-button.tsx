'use client'

import { useState } from 'react'
import { generateAppContent } from './ai-actions'

/** Small "✨ Generate" affordance that fills a field with generated copy. */
export function GenerateButton({
  appId,
  field,
  context,
  onResult,
}: {
  appId: string
  field: string
  context?: string
  onResult: (text: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        setErr(false)
        const r = await generateAppContent({ appId, field, context })
        setBusy(false)
        if (r.ok && r.text) onResult(r.text)
        else setErr(true)
      }}
      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 disabled:opacity-50"
    >
      {busy ? 'Generating…' : err ? 'Retry' : '✨ Generate'}
    </button>
  )
}
