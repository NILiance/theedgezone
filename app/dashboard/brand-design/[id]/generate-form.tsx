'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
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
  const [state, action] = useActionState<GenerateState, FormData>(
    generateConceptsAction,
    {}
  )

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={action}>
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="round" value={String(round)} />
        <input type="hidden" name="count" value={String(count)} />
        <SubmitButton label={label} variant={variant} size={size} count={count} />
      </form>
      <PendingBanner count={count} />
      {state.error && (
        <p className="max-w-xs text-right text-xs text-destructive">
          {state.error}
        </p>
      )}
    </div>
  )
}

function SubmitButton({
  label,
  variant,
  size,
  count,
}: {
  label: string
  variant: 'primary' | 'outline'
  size: 'lg' | 'sm'
  count: number
}) {
  const { pending } = useFormStatus()
  const cls =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground'
      : 'border border-border bg-background'
  const sz = size === 'lg' ? 'px-5 py-3 text-sm' : 'px-3 py-1.5 text-xs'

  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-display flex items-center gap-2 rounded-[var(--radius-sm)] font-bold uppercase tracking-widest disabled:opacity-60 ${cls} ${sz}`}
    >
      {pending ? (
        <>
          <Spinner />
          Generating {count} concept{count === 1 ? '' : 's'}…
        </>
      ) : (
        label
      )}
    </button>
  )
}

function PendingBanner({ count }: { count: number }) {
  const { pending } = useFormStatus()
  if (!pending) return null
  const minWait = Math.round((count * 25) / 60)
  const maxWait = Math.round((count * 60) / 60)
  return (
    <div className="flex max-w-xs items-start gap-2 rounded-[var(--radius-sm)] border border-primary/40 bg-primary/10 px-3 py-2 text-right text-xs text-foreground">
      <Spinner />
      <span className="text-left">
        <span className="text-display block font-bold uppercase tracking-widest text-primary">
          Generating concepts
        </span>
        <span className="text-muted-foreground">
          Our designer is rendering {count} concept{count === 1 ? '' : 's'}. Estimated wait{' '}
          {minWait === maxWait ? `~${minWait} min` : `${minWait}–${maxWait} min`}. Stay on this
          page — concepts will appear when ready.
        </span>
      </span>
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}
