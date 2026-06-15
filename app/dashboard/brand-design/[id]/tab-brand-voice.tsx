'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateBrandVoiceLinesAction,
  type BrandVoiceActionState,
} from './arsenal-tab-actions'
import { BRAND_VOICE_CONTENT_TYPES, BRAND_VOICE_TONES } from '@/lib/arsenal-tab-options'

export function BrandVoiceTab({ brandId, hasFinal }: { brandId: string; hasFinal: boolean }) {
  const [state, action, pending] = useActionState<BrandVoiceActionState, FormData>(
    generateBrandVoiceLinesAction,
    {}
  )
  const [contentType, setContentType] = useState<string>(BRAND_VOICE_CONTENT_TYPES[0]!.value)
  const [tone, setTone] = useState<string>(BRAND_VOICE_TONES[0]!)
  useRefreshOnNewUrl(state.url)

  if (!hasFinal) return <LockedNotice label="Brand Voice" />

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Brand Voice</h2>
      <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground">
        Select a content type and tone, optionally add context (like a recent win or event),
        then click Generate. Each line has a Copy button so you can paste directly into social
        media or your website.
      </p>

      <form action={action} className="mx-auto mt-6 grid max-w-3xl gap-3">
        <input type="hidden" name="brand_id" value={brandId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Content type
            </span>
            <select
              name="content_type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {BRAND_VOICE_CONTENT_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tone
            </span>
            <select
              name="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {BRAND_VOICE_TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <input
          type="text"
          name="context"
          placeholder="Optional context (e.g., Just won conference championship)"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          maxLength={240}
        />
        <div className="mt-2 flex justify-center">
          <button
            type="submit"
            disabled={pending}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>

      {state.lines && state.lines.length > 0 && (
        <div className="mx-auto mt-6 max-w-3xl rounded-[var(--radius)] border border-success/40 bg-success/5 p-4">
          <p className="text-display text-xs font-bold uppercase tracking-widest text-success">
            ✓ Lines generated
          </p>
          <div className="mt-3 space-y-2">
            {state.lines.map((line, i) => (
              <LineRow key={i} line={line} index={i} />
            ))}
          </div>
        </div>
      )}
      {state.error && <p className="mt-4 text-center text-xs text-destructive">{state.error}</p>}
    </div>
  )
}

function LineRow({ line, index }: { line: string; index: number }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(line)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* noop */
    }
  }
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border bg-background p-3">
      <span className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {(index + 1).toString().padStart(2, '0')}
      </span>
      <p className="flex-1 text-sm">{line}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="text-display shrink-0 rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
      >
        {copied ? '✓ Copied' : '📋 Copy'}
      </button>
    </div>
  )
}

function LockedNotice({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
      <p className="text-eyebrow text-accent">🔒 {label} Locked</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a final logo first — every Arsenal asset is built around it.
      </p>
    </div>
  )
}

function useRefreshOnNewUrl(url: string | undefined) {
  const router = useRouter()
  const lastRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (url && url !== lastRef.current) {
      lastRef.current = url
      router.refresh()
    }
  }, [url, router])
}
