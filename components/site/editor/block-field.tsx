'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import type { FieldSpec } from '@/lib/site-builder/block-types'
import {
  EMOJI_GROUPS,
  parseIcon,
  serializeIcon,
  type IconValue,
} from '@/lib/site-builder/emoji-library'

interface BlockFieldProps {
  spec: FieldSpec
  value: unknown
  onChange: (next: unknown) => void
}

/**
 * Schema-driven field renderer. Reads a FieldSpec and produces the right
 * input for it. Used by both block prop editors and the future forms system.
 */
export function BlockField({ spec, value, onChange }: BlockFieldProps) {
  switch (spec.type) {
    case 'text':
    case 'url':
    case 'email':
    case 'phone':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <Input
            id={spec.key}
            type={spec.type === 'email' ? 'email' : spec.type === 'url' ? 'url' : 'text'}
            defaultValue={(value as string) ?? ''}
            placeholder={spec.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
          {spec.help && <p className="mt-1 text-xs text-muted-foreground">{spec.help}</p>}
        </div>
      )

    case 'textarea':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <textarea
            id={spec.key}
            defaultValue={(value as string) ?? ''}
            placeholder={spec.placeholder}
            rows={4}
            onChange={(e) => onChange(e.target.value)}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm leading-relaxed shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          />
        </div>
      )

    case 'richtext':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <textarea
            id={spec.key}
            defaultValue={(value as string) ?? ''}
            placeholder={spec.placeholder ?? 'Plain text or HTML…'}
            rows={6}
            onChange={(e) => onChange(e.target.value)}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm leading-relaxed shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            HTML is supported (e.g. <code>&lt;strong&gt;</code>, <code>&lt;a href=…&gt;</code>, <code>&lt;em&gt;</code>).
          </p>
        </div>
      )

    case 'number':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <Input
            id={spec.key}
            type="number"
            defaultValue={Number(value ?? 0)}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      )

    case 'range':
      return (
        <div>
          <Label htmlFor={spec.key}>
            {spec.label} <span className="text-muted-foreground">({Number(value ?? 0)})</span>
          </Label>
          <input
            id={spec.key}
            type="range"
            defaultValue={Number(value ?? 0)}
            min={spec.min ?? 0}
            max={spec.max ?? 1}
            step={spec.step ?? 0.05}
            onChange={(e) => onChange(Number(e.target.value))}
            className="block w-full accent-primary"
          />
        </div>
      )

    case 'color':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <div className="flex gap-2">
            <Input
              id={spec.key}
              type="color"
              defaultValue={(value as string) || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-16 cursor-pointer p-1"
            />
            <Input
              defaultValue={(value as string) || ''}
              onChange={(e) => {
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value)
              }}
              className="flex-1 font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
      )

    case 'image':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <AssetPicker
            value={(value as string) ?? ''}
            onChange={(v) => onChange(v)}
            placeholder={spec.placeholder ?? 'https://… or click Upload'}
          />
        </div>
      )

    case 'icon_picker':
      return (
        <div>
          <Label>{spec.label}</Label>
          <IconPicker
            value={parseIcon(value)}
            onChange={(next) => onChange(serializeIcon(next))}
          />
          {spec.help && <p className="mt-1 text-xs text-muted-foreground">{spec.help}</p>}
        </div>
      )

    case 'select':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <select
            id={spec.key}
            defaultValue={(value as string) ?? spec.options?.[0]?.value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            {spec.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )

    case 'toggle':
      return (
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            defaultChecked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">{spec.label}</span>
        </label>
      )

    case 'datetime':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <Input
            id={spec.key}
            type="datetime-local"
            defaultValue={toDatetimeLocal((value as string) ?? '')}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )

    case 'json':
      return (
        <div>
          <Label htmlFor={spec.key}>{spec.label}</Label>
          <textarea
            id={spec.key}
            defaultValue={JSON.stringify(value ?? {}, null, 2)}
            rows={8}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                /* keep last valid */
              }
            }}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
          />
        </div>
      )

    case 'repeater': {
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
      const updateItem = (idx: number, next: Record<string, unknown>) =>
        onChange(items.map((it, i) => (i === idx ? next : it)))
      const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx))
      const addItem = () => onChange([...items, { ...(spec.itemDefault ?? {}) }])

      return (
        <div>
          <Label>{spec.label}</Label>
          <div className="mt-2 space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-[var(--radius-sm)] border border-border bg-panel/30 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-eyebrow text-muted-foreground">Item #{idx + 1}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(idx)}
                    className="text-destructive"
                  >
                    Remove
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {(spec.itemFields ?? []).map((sub) => (
                    <BlockField
                      key={sub.key}
                      spec={sub}
                      value={item[sub.key]}
                      onChange={(next) => updateItem(idx, { ...item, [sub.key]: next })}
                    />
                  ))}
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={addItem}>
              + Add item
            </Button>
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

function IconPicker({
  value,
  onChange,
}: {
  value: IconValue
  onChange: (next: IconValue) => void
}) {
  const [search, setSearch] = useState('')
  const filteredGroups = search
    ? EMOJI_GROUPS.map((g) => ({
        ...g,
        emojis: g.emojis.filter((e) => e.includes(search) || g.name.toLowerCase().includes(search.toLowerCase())),
      })).filter((g) => g.emojis.length > 0)
    : EMOJI_GROUPS

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-panel/30 p-2">
        <Mode
          active={value.kind === 'none'}
          label="None"
          onClick={() => onChange({ kind: 'none' })}
        />
        <Mode
          active={value.kind === 'emoji'}
          label="Emoji"
          onClick={() =>
            onChange({ kind: 'emoji', value: value.kind === 'emoji' ? value.value : '🏆' })
          }
        />
        <Mode
          active={value.kind === 'image'}
          label="Image"
          onClick={() =>
            onChange({ kind: 'image', value: value.kind === 'image' ? value.value : '' })
          }
        />
        <div className="ml-auto flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background text-2xl">
          {value.kind === 'emoji' ? (
            value.value
          ) : value.kind === 'image' && value.value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.value} alt="" className="h-full w-full rounded-[var(--radius-sm)] object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {value.kind === 'emoji' && (
        <div className="space-y-2 rounded-[var(--radius-sm)] border border-border bg-background p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="h-8 text-xs"
          />
          <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
            {filteredGroups.map((g) => (
              <div key={g.name}>
                <p className="text-eyebrow mb-1 text-[10px] text-muted-foreground">{g.name}</p>
                <div className="grid grid-cols-10 gap-1">
                  {g.emojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => onChange({ kind: 'emoji', value: e })}
                      className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-xl transition-colors ${
                        value.value === e
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'hover:bg-panel'
                      }`}
                      title={e}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No emojis match &quot;{search}&quot;
              </p>
            )}
          </div>
          <Input
            value={value.value}
            onChange={(e) => onChange({ kind: 'emoji', value: e.target.value })}
            placeholder="Or paste any emoji"
            className="h-8 font-mono text-sm"
          />
        </div>
      )}

      {value.kind === 'image' && (
        <AssetPicker
          value={value.value}
          onChange={(v) => onChange({ kind: 'image', value: v })}
          placeholder="https://… or click Upload"
        />
      )}
    </div>
  )
}

function Mode({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-background text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
