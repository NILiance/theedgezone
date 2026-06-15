'use client'

import { useActionState, useState } from 'react'
import { saveBrandBasicsAction, type BasicsState } from './basics-actions'

export interface BrandBasicsValues {
  brand_name: string | null
  sport: string | null
  athletic_position: string | null
  school: string | null
  jersey_number: string | null
  style_seed: string | null
  primary_color: string | null
  secondary_color: string | null
}

export function BasicsForm({
  brandId,
  initial,
  syncToProfile = true,
}: {
  brandId: string
  initial: BrandBasicsValues
  syncToProfile?: boolean
}) {
  const [state, action, pending] = useActionState<BasicsState, FormData>(
    saveBrandBasicsAction,
    {}
  )
  // Local mirror so the colour swatches preview without an extra round trip.
  const [values, setValues] = useState<BrandBasicsValues>(initial)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="brand_id" value={brandId} />
      <input type="hidden" name="sync_to_profile" value={syncToProfile ? '1' : '0'} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand name">
          <input
            name="brand_name"
            defaultValue={initial.brand_name ?? ''}
            placeholder="e.g. Mike Ramirez"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Sport">
          <input
            name="sport"
            defaultValue={initial.sport ?? ''}
            placeholder="Football, Basketball…"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Position">
          <input
            name="athletic_position"
            defaultValue={initial.athletic_position ?? ''}
            placeholder="QB, Forward, OF…"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="School">
          <input
            name="school"
            defaultValue={initial.school ?? ''}
            placeholder="University, high school…"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Jersey #">
          <input
            name="jersey_number"
            defaultValue={initial.jersey_number ?? ''}
            placeholder="14"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field
          label="Style seed"
          hint="Aesthetic direction — vintage, minimalist, bold, futuristic…"
        >
          <input
            name="style_seed"
            defaultValue={initial.style_seed ?? ''}
            placeholder="Bold, vintage, athletic…"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Primary color">
          <ColorRow
            value={values.primary_color ?? '#C8A84E'}
            name="primary_color"
            onChange={(v) => setValues((s) => ({ ...s, primary_color: v }))}
          />
        </Field>
        <Field label="Secondary color">
          <ColorRow
            value={values.secondary_color ?? '#000000'}
            name="secondary_color"
            onChange={(v) => setValues((s) => ({ ...s, secondary_color: v }))}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save brand basics'}
        </button>
        {syncToProfile && (
          <p className="text-xs text-muted-foreground">
            Edits also sync to your <span className="text-foreground">profile</span> (name, sport,
            position, school, brand colors).
          </p>
        )}
        {state.ok && (
          <span className="text-display rounded-full bg-success/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-success">
            ✓ Saved
          </span>
        )}
        {state.error && (
          <span className="text-display rounded-full bg-destructive/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
            {state.error}
          </span>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

function ColorRow({
  value,
  name,
  onChange,
}: {
  value: string
  name: string
  onChange: (v: string) => void
}) {
  return (
    <span className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded-[var(--radius-sm)] border border-border bg-background"
      />
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
      />
    </span>
  )
}
