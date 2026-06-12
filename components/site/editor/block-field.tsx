'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import type { FieldSpec } from '@/lib/site-builder/block-types'

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

function toDatetimeLocal(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
