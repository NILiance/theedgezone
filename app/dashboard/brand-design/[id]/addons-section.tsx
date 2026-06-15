'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { generateAddonAction, type AddonState } from './addons-actions'

type Addon = {
  kind: string
  url: string | null
  metadata: Record<string, unknown>
  created_at: string
}

const ADDONS = [
  { kind: 'logo_animation', name: 'Logo animation', description: 'Animated SVG of your logo for splash screens and intros.' },
  { kind: 'brand_voice_doc', name: 'Brand voice doc', description: 'One-page voice guide — tagline, tone, do/don\'t, sample post.' },
  { kind: 'qr_code', name: 'QR code', description: 'Branded QR that points to your personal site. Print or share digital.' },
  { kind: 'email_signature', name: 'Email signature', description: 'HTML signature for Gmail / Outlook — logo, name, position, socials.' },
  { kind: 'social_avatars', name: 'Social avatars (pack)', description: 'IG / TikTok / YouTube / Twitter / FB / LinkedIn — sized correctly, on background.' },
  { kind: 'trading_card', name: 'Trading card', description: 'Vintage-style SVG card with your photo, jersey number, position, and brand colors.' },
] as const

export function AddonsSection({
  brandId,
  hasSelected,
  existing,
}: {
  brandId: string
  hasSelected: boolean
  existing: Addon[]
}) {
  const byKind = new Map<string, Addon>(existing.map((a) => [a.kind, a]))
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-eyebrow text-primary">Asset add-ons</p>
        <p className="text-xs text-muted-foreground">
          Generated from your selected logo + brand basics
        </p>
      </div>
      {!hasSelected && (
        <p className="mb-3 rounded-[var(--radius-sm)] border border-border bg-panel/30 p-3 text-sm text-muted-foreground">
          Pick a final logo first — add-ons use it as the source.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {ADDONS.map((a) => {
          const existing = byKind.get(a.kind)
          return (
            <AddonCard
              key={a.kind}
              brandId={brandId}
              kind={a.kind}
              name={a.name}
              description={a.description}
              existing={existing}
              disabled={!hasSelected}
            />
          )
        })}
      </div>
    </section>
  )
}

function AddonCard({
  brandId,
  kind,
  name,
  description,
  existing,
  disabled,
}: {
  brandId: string
  kind: string
  name: string
  description: string
  existing: Addon | undefined
  disabled: boolean
}) {
  const [state, action, pending] = useActionState<AddonState, FormData>(generateAddonAction, {})
  const url = state.url ?? existing?.url ?? null
  // Force a server-component re-render the moment a fresh URL comes back so
  // the new addon shows up in Your Creations without a navigation.
  const router = useRouter()
  const lastRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (state.url && state.url !== lastRef.current) {
      lastRef.current = state.url
      router.refresh()
    }
  }, [state.url, router])
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-display font-bold">{name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {url && (
          <span className="text-display rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success">
            Ready
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="brand_id" value={brandId} />
          <input type="hidden" name="kind" value={kind} />
          <button
            type="submit"
            disabled={disabled || pending}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Generating…' : url ? 'Regenerate' : 'Generate'}
          </button>
        </form>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
          >
            Download
          </a>
        )}
      </div>
      {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
    </div>
  )
}
