'use client'

import { useActionState, useState } from 'react'
import { createLogoModRequest, type LogoModState } from './actions'

const TIERS = [
  {
    key: 'quick' as const,
    name: 'Quick',
    price: 49,
    description: 'Single color swap or simple text change. 24-hr turn.',
  },
  {
    key: 'standard' as const,
    name: 'Standard',
    price: 149,
    description: 'Up to 3 revisions, color + composition tweaks, vector cleanup. 3-day turn.',
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: 349,
    description: 'Full re-vector + 5 revisions + delivery in PNG / SVG / EPS / PDF. 5-day turn.',
  },
]

export function LogoModForm() {
  const [state, action, pending] = useActionState<LogoModState, FormData>(createLogoModRequest, {})
  const [tier, setTier] = useState<'quick' | 'standard' | 'pro'>('standard')

  if (state.checkoutUrl) {
    if (typeof window !== 'undefined') window.location.href = state.checkoutUrl
    return (
      <p className="rounded-[var(--radius)] border border-border bg-panel/40 p-6 text-sm">
        Redirecting to checkout…
      </p>
    )
  }

  const selectedTier = TIERS.find((t) => t.key === tier)!

  return (
    <form action={action} className="space-y-6 rounded-[var(--radius)] border border-border bg-panel/40 p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {TIERS.map((t) => (
          <label
            key={t.key}
            className={`relative cursor-pointer rounded-[var(--radius)] border-2 p-4 transition ${
              tier === t.key
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background/40 hover:border-primary/40'
            }`}
          >
            <input
              type="radio"
              name="tier"
              value={t.key}
              checked={tier === t.key}
              onChange={() => setTier(t.key)}
              className="sr-only"
            />
            <p className="text-eyebrow text-primary">{t.name}</p>
            <p className="text-display mt-1 text-2xl font-black">${t.price}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t.description}</p>
          </label>
        ))}
      </div>

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Original logo URL
        </span>
        <input
          name="original_logo_url"
          required
          placeholder="https://… (link to PNG, SVG, AI, or EPS)"
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
        />
      </label>

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          What do you want changed?
        </span>
        <textarea
          name="requested_changes"
          rows={5}
          required
          minLength={20}
          placeholder="Change the navy to electric blue. Drop the year. Tighten the spacing between letters. Need PNG + SVG out."
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-baseline justify-between rounded-[var(--radius-sm)] border border-border bg-background/40 px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {selectedTier.name} tier
        </p>
        <p className="text-display text-2xl font-black text-primary">${selectedTier.price}</p>
      </div>

      {state.error && (
        <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="text-display w-full rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Setting up checkout…' : 'Continue to checkout →'}
      </button>
    </form>
  )
}
