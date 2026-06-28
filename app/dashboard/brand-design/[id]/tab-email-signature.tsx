'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateEmailSigAction,
  type EmailSigActionState,
} from './arsenal-tab-actions'
import { buildEmailSignatureHtml } from '@/lib/email-signature-html'

const LIGHT = { bg: '#ffffff', name: '#111111', body: '#444444', link: '#3aa7ff' }
const DARK = { bg: '#0a0e14', name: '#ffffff', body: '#cccccc', link: '#caa86a' }

function socialUrls(ig: string, x: string, tiktok: string, linkedin: string): Record<string, string> {
  const m: Record<string, string> = {}
  const add = (label: string, base: string, v: string) => {
    const t = v.trim()
    if (t) m[label] = /^https?:\/\//i.test(t) ? t : `${base}${t.replace(/^@/, '')}`
  }
  add('Instagram', 'https://instagram.com/', ig)
  add('X', 'https://x.com/', x)
  add('TikTok', 'https://tiktok.com/@', tiktok)
  add('LinkedIn', 'https://linkedin.com/in/', linkedin)
  return m
}

export function EmailSignatureTab({
  brandId,
  hasFinal,
  brandPrimary,
  brandName,
  logoUrl,
}: {
  brandId: string
  hasFinal: boolean
  brandPrimary: string | null
  brandName: string
  logoUrl: string
}) {
  const [state, action, pending] = useActionState<EmailSigActionState, FormData>(
    generateEmailSigAction,
    {}
  )
  const [bg, setBg] = useState(LIGHT.bg)
  const [nameColor, setNameColor] = useState(brandPrimary ?? LIGHT.name)
  const [body, setBody] = useState(LIGHT.body)
  const [link, setLink] = useState(brandPrimary ?? LIGHT.link)
  const [logoSize, setLogoSize] = useState(72)
  const [f, setF] = useState({
    name: brandName || '',
    title: '',
    sport: '',
    school: '',
    email: '',
    phone: '',
    website: '',
    ig: '',
    x: '',
    tiktok: '',
    linkedin: '',
  })
  const [copied, setCopied] = useState(false)
  useRefreshOnNewUrl(state.url)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }))

  const applyPreset = (preset: 'light' | 'dark') => {
    const p = preset === 'light' ? LIGHT : DARK
    setBg(p.bg)
    setNameColor(brandPrimary ?? p.name)
    setBody(p.body)
    setLink(brandPrimary ?? p.link)
  }

  if (!hasFinal) return <LockedNotice label="Email Signature" />

  const html = buildEmailSignatureHtml({
    name: f.name || 'Your Name',
    title: f.title,
    sport: f.sport,
    school: f.school,
    email: f.email,
    phone: f.phone,
    website: f.website,
    socials: socialUrls(f.ig, f.x, f.tiktok, f.linkedin),
    logoUrl: logoUrl || undefined,
    logoSize,
    bg,
    nameColor,
    bodyColor: body,
    linkColor: link,
  })

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  const inputCls = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm'

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Email Signature Designer</h2>
      <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground">
        Build your signature live — edit the fields and watch the preview update. Copy the HTML
        into Gmail or Outlook, or save it to Your Creations.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <form action={action} className="grid gap-3">
          <input type="hidden" name="brand_id" value={brandId} />
          <input type="hidden" name="bg_color" value={bg} />
          <input type="hidden" name="name_color" value={nameColor} />
          <input type="hidden" name="body_color" value={body} />
          <input type="hidden" name="link_color" value={link} />
          <input type="hidden" name="logo_size" value={logoSize} />
          <input type="hidden" name="name" value={f.name} />
          <input type="hidden" name="sport" value={f.sport} />
          <input type="hidden" name="email" value={f.email} />
          <input type="hidden" name="school" value={f.school} />
          <input type="hidden" name="ig" value={f.ig} />
          <input type="hidden" name="x" value={f.x} />
          <input type="hidden" name="tiktok" value={f.tiktok} />
          <input type="hidden" name="linkedin" value={f.linkedin} />

          <div className="grid gap-3 sm:grid-cols-2">
            <input value={f.name} onChange={set('name')} placeholder="Name" className={inputCls} />
            <input name="title" value={f.title} onChange={set('title')} placeholder="Title (e.g. Student Athlete)" className={inputCls} />
            <input value={f.sport} onChange={set('sport')} placeholder="Sport" className={inputCls} />
            <input value={f.school} onChange={set('school')} placeholder="School / Team" className={inputCls} />
            <input value={f.email} onChange={set('email')} type="email" placeholder="Email" className={inputCls} />
            <input name="phone" value={f.phone} onChange={set('phone')} type="tel" placeholder="Phone" className={inputCls} />
          </div>
          <input name="website" value={f.website} onChange={set('website')} type="url" placeholder="Website or Linktree" className={inputCls} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={f.ig} onChange={set('ig')} placeholder="Instagram @handle" className={inputCls} />
            <input value={f.x} onChange={set('x')} placeholder="X @handle" className={inputCls} />
            <input value={f.tiktok} onChange={set('tiktok')} placeholder="TikTok @handle" className={inputCls} />
            <input value={f.linkedin} onChange={set('linkedin')} placeholder="LinkedIn /in/handle" className={inputCls} />
          </div>

          <div className="flex flex-wrap items-end gap-4 border-t border-border pt-4">
            <ColorPicker label="Background" value={bg} onChange={setBg} />
            <ColorPicker label="Name" value={nameColor} onChange={setNameColor} />
            <ColorPicker label="Content" value={body} onChange={setBody} />
            <ColorPicker label="Links" value={link} onChange={setLink} />
            <label className="block">
              <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Logo size · {logoSize}px
              </span>
              <input
                type="range"
                min={40}
                max={140}
                step={4}
                value={logoSize}
                onChange={(e) => setLogoSize(Number(e.target.value))}
                className="mt-3 w-32 cursor-pointer align-middle"
              />
            </label>
            <div>
              <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Presets
              </span>
              <div className="mt-1 flex gap-1">
                <button type="button" onClick={() => applyPreset('dark')} className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">Dark</button>
                <button type="button" onClick={() => applyPreset('light')} className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">Light</button>
              </div>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save Signature'}
            </button>
            <button
              type="button"
              onClick={copyHtml}
              className="text-display rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-panel"
            >
              {copied ? '✓ Copied' : '⧉ Copy HTML'}
            </button>
          </div>
          {state.error && <p className="text-xs text-destructive">{state.error}</p>}
          {state.url && !pending && <p className="text-[10px] text-success">✓ Saved to Your Creations below.</p>}
        </form>

        {/* Live preview */}
        <div>
          <p className="text-display mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Live preview
          </p>
          <div className="overflow-auto rounded-[var(--radius)] border border-border p-5" style={{ background: bg }}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Paste the copied HTML into Gmail (Settings → Signature) or Outlook (Options → Mail →
            Signatures).
          </p>
        </div>
      </div>
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-8 w-16 cursor-pointer rounded border border-border bg-background" />
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
