'use client'

import { useActionState } from 'react'
import { generateConceptsAction, type GenerateState } from './generate-actions'

export function GenerateConceptsButton({
  brandId,
  round,
  count,
  label,
  variant = 'primary',
  size = 'lg',
}: {
  brandId: string
  round: number
  count: number
  label: string
  variant?: 'primary' | 'outline'
  size?: 'lg' | 'sm'
}) {
  const [state, action, pending] = useActionState<GenerateState, FormData>(
    generateConceptsAction,
    {}
  )

  const cls =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground'
      : 'border border-border bg-background'
  const sz = size === 'lg' ? 'px-5 py-3 text-sm' : 'px-3 py-1.5 text-xs'

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="round" value={String(round)} />
        <input type="hidden" name="count" value={String(count)} />
        <button
          type="submit"
          disabled={pending}
          className={`text-display rounded-[var(--radius-sm)] font-bold uppercase tracking-widest disabled:opacity-50 ${cls} ${sz}`}
        >
          {pending ? 'Generating…' : label}
        </button>
      </form>
      {state.error && (
        <p className="max-w-xs text-right text-xs text-destructive">
          {state.error}
        </p>
      )}
    </div>
  )
}
