'use client'

import { useActionState, useRef, useState } from 'react'
import {
  saveBrandPreferencesAction,
  type PrefsState,
} from './preferences-actions'

export interface BrandPreferencesValues {
  brand_name: string | null
  initials: string | null
  sport: string | null
  athletic_position: string | null
  school: string | null
  jersey_number: string | null
  primary_color: string | null
  secondary_color: string | null
  vibe: string | null
  bg_pref: string | null
  include_name: boolean
  include_initials: boolean
  include_jersey: boolean
  elements: string | null
}

const VIBE_OPTIONS = [
  'Tech & Modern',
  'Bold',
  'Premium',
  'Futuristic',
  'Classic',
  'Vintage',
  'Streetwear',
  'Playful',
]

const BG_OPTIONS = [
  { value: 'variety', label: 'Variety (Best Match)' },
  { value: 'light', label: 'Light / White' },
  { value: 'dark', label: 'Dark / Black' },
  { value: 'gradient', label: 'Gradient' },
]

export function PreferencesForm({
  brandId,
  initial,
  generateRound,
  generateCount,
}: {
  brandId: string
  initial: BrandPreferencesValues
  /** When provided, render a "Save & Generate" button that submits the
   *  preferences AND triggers concept generation in a single click. */
  generateRound?: number
  generateCount?: number
}) {
  const [state, action, pending] = useActionState<PrefsState, FormData>(
    saveBrandPreferencesAction,
    {}
  )
  const [values, setValues] = useState<BrandPreferencesValues>(initial)
  // Toggled by the two submit buttons so the same form can either just
  // save, or save AND generate. onClick fires synchronously before the
  // form submit event, so setting the value here is captured.
  const generateCountRef = useRef<HTMLInputElement>(null)
  const showGenerate = typeof generateCount === 'number' && generateCount > 0

  const update = <K extends keyof BrandPreferencesValues>(
    key: K,
    value: BrandPreferencesValues[K]
  ) => setValues((s) => ({ ...s, [key]: value }))

  const colorString = `${values.primary_color ?? '#000000'} and ${
    values.secondary_color ?? '#808080'
  }`

  return (
    <form
      action={action}
      className="space-y-5 rounded-[var(--radius)] border border-border bg-panel/40 p-5"
    >
      <input type="hidden" name="brand_id" value={brandId} />

      <div>
        <p className="text-eyebrow text-primary">Brand Preferences</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Loaded from your profile. Edits save back to your profile so every page sees the
          latest version.
        </p>
      </div>

      {/* Identity row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand name" required>
          <input
            name="brand_name"
            defaultValue={initial.brand_name ?? ''}
            placeholder="Mike Ramirez"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Initials for logo">
          <input
            name="initials"
            defaultValue={initial.initials ?? ''}
            placeholder="MR"
            maxLength={5}
            className={inputCls}
          />
        </Field>
        <Field label="Sport" required>
          <input
            name="sport"
            defaultValue={initial.sport ?? ''}
            placeholder="Football, Basketball…"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Position">
          <input
            name="athletic_position"
            defaultValue={initial.athletic_position ?? ''}
            placeholder="QB, Forward, OF…"
            className={inputCls}
          />
        </Field>
        <Field label="School">
          <input
            name="school"
            defaultValue={initial.school ?? ''}
            placeholder="University, high school…"
            className={inputCls}
          />
        </Field>
        <Field label="Jersey #">
          <input
            name="jersey_number"
            defaultValue={initial.jersey_number ?? ''}
            placeholder="14"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Colors + Vibe row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Primary color" required>
          <ColorRow
            value={values.primary_color ?? '#000000'}
            name="primary_color"
            onChange={(v) => update('primary_color', v)}
          />
        </Field>
        <Field label="Secondary color">
          <ColorRow
            value={values.secondary_color ?? '#808080'}
            name="secondary_color"
            onChange={(v) => update('secondary_color', v)}
          />
        </Field>
        <Field label="Brand colors (preview)">
          <p className={`${inputCls} flex items-center font-mono text-[11px]`}>{colorString}</p>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Brand vibe"
          required
          hint="Drives the overall design direction. Concept variations come from internal style rotations."
        >
          <select
            name="vibe"
            value={values.vibe ?? VIBE_OPTIONS[0]!}
            onChange={(e) => update('vibe', e.target.value)}
            className={inputCls}
          >
            {VIBE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Background preference"
          hint="Pick the background style for most concepts. 'Variety' lets the designer mix it up."
        >
          <select
            name="bg_pref"
            value={values.bg_pref ?? 'variety'}
            onChange={(e) => update('bg_pref', e.target.value)}
            className={inputCls}
          >
            {BG_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Logo customization */}
      <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-4">
        <p className="text-eyebrow text-accent">Logo Customization</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Different concepts will be generated based on the preferences below.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Checkbox
            name="include_name"
            checked={values.include_name}
            onChange={(v) => update('include_name', v)}
            label="Include my name in the logo"
          />
          <Checkbox
            name="include_initials"
            checked={values.include_initials}
            onChange={(v) => update('include_initials', v)}
            label="Include my initials"
          />
          <Checkbox
            name="include_jersey"
            checked={values.include_jersey}
            onChange={(v) => update('include_jersey', v)}
            label="Include my jersey number"
          />
        </div>
        <div className="mt-4">
          <Field
            label="Include these elements in the logo"
            hint="Free-text, comma separated. Example: devil, football, crown, shield, lightning bolt"
          >
            <input
              name="elements"
              defaultValue={initial.elements ?? ''}
              placeholder="devil, football, crown…"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {/* Hidden inputs the two submit buttons toggle to switch between
          "just save" and "save + generate". Setting the ref's value in
          the button's onClick lands before form submission. */}
      <input ref={generateCountRef} type="hidden" name="generate_count" defaultValue="" />
      {showGenerate && (
        <input type="hidden" name="generate_round" value={String(generateRound ?? 1)} />
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="submit"
          disabled={pending}
          onClick={() => {
            if (generateCountRef.current) generateCountRef.current.value = ''
          }}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save preferences'}
        </button>
        {showGenerate && (
          <button
            type="submit"
            disabled={pending}
            onClick={() => {
              if (generateCountRef.current)
                generateCountRef.current.value = String(generateCount)
            }}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? `Generating ${generateCount}…` : `Save & Generate ${generateCount} concepts`}
          </button>
        )}
        <p className="text-xs text-muted-foreground">Edits sync back to your profile.</p>
        {state.ok && state.generated ? (
          <span className="text-display rounded-full bg-success/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-success">
            ✓ Saved · {state.generated} new concepts
          </span>
        ) : state.ok ? (
          <span className="text-display rounded-full bg-success/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-success">
            ✓ Saved
          </span>
        ) : null}
        {state.error && (
          <span className="text-display rounded-full bg-destructive/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
            {state.error}
          </span>
        )}
      </div>
    </form>
  )
}

const inputCls =
  'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm'

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
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

function Checkbox({
  name,
  checked,
  onChange,
  label,
}: {
  name: string
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer"
      />
      <span>{label}</span>
    </label>
  )
}
