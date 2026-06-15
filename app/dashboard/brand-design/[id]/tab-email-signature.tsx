'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateEmailSigAction,
  type EmailSigActionState,
} from './arsenal-tab-actions'

const LIGHT = {
  bg: '#ffffff',
  name: '#111111',
  body: '#444444',
  link: '#3aa7ff',
}
const DARK = {
  bg: '#0a0e14',
  name: '#ffffff',
  body: '#cccccc',
  link: '#caa86a',
}

export function EmailSignatureTab({
  brandId,
  hasFinal,
  brandPrimary,
}: {
  brandId: string
  hasFinal: boolean
  brandPrimary: string | null
}) {
  const [state, action, pending] = useActionState<EmailSigActionState, FormData>(
    generateEmailSigAction,
    {}
  )
  const [bg, setBg] = useState(LIGHT.bg)
  const [name, setName] = useState(brandPrimary ?? LIGHT.name)
  const [body, setBody] = useState(LIGHT.body)
  const [link, setLink] = useState(brandPrimary ?? LIGHT.link)
  useRefreshOnNewUrl(state.url)

  const applyPreset = (preset: 'light' | 'dark') => {
    const p = preset === 'light' ? LIGHT : DARK
    setBg(p.bg)
    setName(brandPrimary ?? p.name)
    setBody(p.body)
    setLink(brandPrimary ?? p.link)
  }

  if (!hasFinal) return <LockedNotice label="Email Signature" />

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Email Signature Generator</h2>
      <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground">
        Create a professional email signature with your logo, name, and social links. Copy the
        HTML and paste it into Gmail, Outlook, or any email client.
      </p>

      <form action={action} className="mx-auto mt-6 grid max-w-3xl gap-4">
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="bg_color" value={bg} />
        <input type="hidden" name="name_color" value={name} />
        <input type="hidden" name="body_color" value={body} />
        <input type="hidden" name="link_color" value={link} />

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="title"
            placeholder="Title (e.g., Student Athlete)"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <input
          type="url"
          name="website"
          placeholder="Website or Linktree URL (optional)"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />

        <div className="flex flex-wrap items-end gap-4 border-t border-border pt-4">
          <ColorPicker label="Background" value={bg} onChange={setBg} />
          <ColorPicker label="Name" value={name} onChange={setName} />
          <ColorPicker label="Content" value={body} onChange={setBody} />
          <ColorPicker label="Links / Social" value={link} onChange={setLink} />
          <div className="flex items-end gap-2">
            <div>
              <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Presets
              </span>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => applyPreset('dark')}
                  className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('light')}
                  className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                >
                  Light
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          <button
            type="submit"
            disabled={pending}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Generating…' : 'Generate Signature'}
          </button>
        </div>
      </form>

      {state.url && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-[var(--radius)] border border-success/40 bg-success/5 p-5 text-center">
          <p className="text-display text-sm font-bold text-success">✓ Signature ready</p>
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Open preview + copy HTML →
          </a>
        </div>
      )}
      {state.error && <p className="mt-4 text-center text-xs text-destructive">{state.error}</p>}
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-8 w-16 cursor-pointer rounded border border-border bg-background"
      />
    </label>
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
