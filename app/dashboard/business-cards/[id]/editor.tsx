'use client'

import { useActionState, useState } from 'react'
import { saveBusinessCard, type CardState } from '../actions'

type Card = {
  id: string
  slug: string
  display_name: string | null
  title: string | null
  organization: string | null
  tagline: string | null
  phone: string | null
  email: string | null
  website: string | null
  avatar_url: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  socials: Record<string, string>
  status: string
}

export function BusinessCardEditor({ card }: { card: Card }) {
  const [state, action, pending] = useActionState<CardState, FormData>(saveBusinessCard, {})
  const [primary, setPrimary] = useState(card.primary_color)
  const [secondary, setSecondary] = useState(card.secondary_color)
  const [displayName, setDisplayName] = useState(card.display_name ?? '')
  const [title, setTitle] = useState(card.title ?? '')
  const [org, setOrg] = useState(card.organization ?? '')
  const socials = card.socials ?? {}

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form action={action} className="space-y-5 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <input type="hidden" name="card_id" value={card.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="display_name" label="Display name" value={displayName} onChange={setDisplayName} />
          <Field name="title" label="Title / role" value={title} onChange={setTitle} />
          <Field name="organization" label="Organization / school" value={org} onChange={setOrg} />
          <Field name="tagline" label="Tagline" defaultValue={card.tagline ?? ''} />
          <Field name="phone" label="Phone" defaultValue={card.phone ?? ''} />
          <Field name="email" label="Email" type="email" defaultValue={card.email ?? ''} />
          <Field name="website" label="Website" type="url" defaultValue={card.website ?? ''} />
          <Field
            name="avatar_url"
            label="Avatar URL"
            defaultValue={card.avatar_url ?? ''}
            placeholder="https://…"
          />
          <Field name="logo_url" label="Logo URL" defaultValue={card.logo_url ?? ''} placeholder="https://…" />
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Primary color</span>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-[var(--radius-sm)] border border-border"
              />
              <input
                name="primary_color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-sm"
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Secondary color</span>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-[var(--radius-sm)] border border-border"
              />
              <input
                name="secondary_color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-sm"
              />
            </div>
          </label>
        </div>

        <div>
          <p className="text-eyebrow mt-2 text-muted-foreground">Socials</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin'] as const).map((k) => (
              <Field
                key={k}
                name={`social_${k}`}
                label={k}
                defaultValue={socials?.[k] ?? ''}
                placeholder={`https://${k}.com/...`}
              />
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <span className="block text-xs text-muted-foreground">Status</span>
          <select
            name="status"
            defaultValue={card.status}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state.ok && <p className="text-xs text-success">Saved.</p>}

        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save card'}
        </button>
      </form>

      {/* Live preview */}
      <aside>
        <div className="sticky top-6 rounded-[var(--radius)] p-6 shadow-elevated" style={{ background: primary, color: secondary }}>
          <p className="text-[10px] uppercase tracking-widest opacity-70">Preview</p>
          <p className="text-display mt-3 text-2xl font-black">{displayName || 'Your Name'}</p>
          {title && <p className="mt-1 text-sm opacity-80">{title}</p>}
          {org && <p className="mt-1 text-xs opacity-70">{org}</p>}
          <div className="mt-4 h-px" style={{ background: secondary, opacity: 0.4 }} />
          <p className="mt-3 text-xs opacity-80">/card/{card.slug}</p>
        </div>
      </aside>
    </div>
  )
}

function Field({
  name,
  label,
  type,
  value,
  defaultValue,
  placeholder,
  onChange,
}: {
  name: string
  label: string
  type?: string
  value?: string
  defaultValue?: string
  placeholder?: string
  onChange?: (v: string) => void
}) {
  const controlled = value !== undefined && onChange
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <input
        type={type ?? 'text'}
        name={name}
        {...(controlled
          ? { value, onChange: (e) => onChange(e.target.value) }
          : { defaultValue })}
        placeholder={placeholder}
        className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
      />
    </label>
  )
}
