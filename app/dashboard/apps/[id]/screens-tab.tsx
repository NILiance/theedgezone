'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import {
  SCREEN_TYPES,
  screenDef,
  screenPattern,
  type AppScreen,
  type ScreenTypeDef,
} from '@/lib/app-screens'
import { GenerateButton } from './generate-button'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const inputCls = 'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'

/**
 * Screens tab — the screen list (add / reorder / select) plus a per-screen
 * editor. Selecting a screen drives the live preview. Home and Bio get rich,
 * legacy-faithful editors; the rest use pattern editors.
 */
export function ScreensTab({
  appId,
  screens,
  activeId,
  onScreens,
  onActive,
}: {
  appId: string
  screens: AppScreen[]
  activeId: string | null
  onScreens: (s: AppScreen[]) => void
  onActive: (id: string) => void
}) {
  const [picking, setPicking] = useState(false)

  const add = (def: ScreenTypeDef) => {
    const id = `${def.type}-${Math.random().toString(36).slice(2, 7)}`
    onScreens([
      ...screens,
      { id, title: def.defaultTitle, icon: def.icon, type: def.type, content: clone(def.defaultContent) },
    ])
    onActive(id)
    setPicking(false)
  }
  const patch = (i: number, p: Partial<AppScreen>) => onScreens(screens.map((sc, idx) => (idx === i ? { ...sc, ...p } : sc)))
  const remove = (i: number) => onScreens(screens.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= screens.length) return
    const next = [...screens]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    onScreens(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Tap a screen to edit it — the preview updates live.</p>
        <Button size="sm" variant="outline" onClick={() => setPicking((v) => !v)}>
          {picking ? 'Close' : '+ Add screen'}
        </Button>
      </div>

      {picking && (
        <div className="grid grid-cols-2 gap-2 rounded-[var(--radius)] border border-border bg-panel/40 p-3 sm:grid-cols-3">
          {SCREEN_TYPES.map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => add(def)}
              className="rounded-[var(--radius-sm)] border border-border bg-panel-elevated/40 p-2 text-left hover:border-primary/40"
            >
              <p className="text-display text-xs font-bold">{def.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{def.description}</p>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {screens.map((sc, i) => {
          const open = activeId === sc.id
          return (
            <div
              key={sc.id}
              className={`rounded-[var(--radius)] border bg-panel/40 ${open ? 'border-primary/50' : 'border-border'}`}
            >
              <div className="flex items-center gap-2 p-3">
                <button type="button" onClick={() => onActive(sc.id)} className="flex flex-1 items-center gap-2 text-left">
                  <span className="text-display rounded-[var(--radius-sm)] bg-panel-elevated px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {screenDef(sc.type)?.label ?? sc.type}
                  </span>
                  <span className="text-display flex-1 truncate font-bold">{sc.title}</span>
                </button>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-muted-foreground disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === screens.length - 1} className="px-1 text-muted-foreground disabled:opacity-30">↓</button>
                <button type="button" onClick={() => remove(i)} className="px-2 text-destructive">✕</button>
              </div>
              {open && (
                <div className="border-t border-border p-3">
                  <ScreenForm appId={appId} screen={sc} onChange={(p) => patch(i, p)} />
                </div>
              )}
            </div>
          )
        })}
        {screens.length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No screens yet. Add your first above.
          </p>
        )}
      </div>
    </div>
  )
}

function ScreenForm({ appId, screen, onChange }: { appId: string; screen: AppScreen; onChange: (patch: Partial<AppScreen>) => void }) {
  const content = (screen.content ?? {}) as Record<string, unknown>
  const setContent = (patch: Record<string, unknown>) => onChange({ content: { ...content, ...patch } })

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="block text-xs text-muted-foreground">Screen title (tab label)</span>
        <input value={screen.title} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
      </label>

      {screen.type === 'home' ? (
        <HomeEditor content={content} setContent={setContent} />
      ) : (
        <PatternEditor appId={appId} screen={screen} content={content} setContent={setContent} />
      )}
    </div>
  )
}

function HomeEditor({
  content,
  setContent,
}: {
  content: Record<string, unknown>
  setContent: (patch: Record<string, unknown>) => void
}) {
  const splash = Array.isArray(content.splash_images) ? (content.splash_images as string[]) : []
  const effects = (content.effects ?? {}) as Record<string, unknown>
  const announcements = Array.isArray(content.announcements) ? (content.announcements as Record<string, string>[]) : []
  const setFx = (p: Record<string, unknown>) => setContent({ effects: { ...effects, ...p } })

  return (
    <div className="space-y-4">
      <ImageList label="Splash images" images={splash} onChange={(v) => setContent({ splash_images: v })} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Text label="Name on splash" value={String(content.heading ?? '')} onChange={(v) => setContent({ heading: v })} placeholder="Defaults to app name" />
        <Select label="Name style" value={String(content.name_style ?? 'bold')} onChange={(v) => setContent({ name_style: v })}
          options={['bold', 'condensed', 'script', 'serif', 'minimal', 'display', 'modern', 'urban', 'luxury', 'retro', 'tech', 'handwritten']} />
        <Range label={`Name size — ${Number(content.name_size ?? 100)}%`} min={50} max={200} value={Number(content.name_size ?? 100)} onChange={(v) => setContent({ name_size: v })} />
        <Select label="Name position" value={String(content.name_position ?? 'center')} onChange={(v) => setContent({ name_position: v })}
          options={['center', 'top', 'upper-third', 'lower-third', 'bottom']} />
      </div>

      <div className="flex flex-wrap gap-4">
        <Check label="Show name" checked={content.show_name !== false} onChange={(v) => setContent({ show_name: v })} />
        <Check label="Show nav grid" checked={content.show_nav_grid !== false} onChange={(v) => setContent({ show_nav_grid: v })} />
      </div>

      <div className="rounded-[var(--radius-sm)] border border-border bg-panel/30 p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Splash effects</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Color label="Tint" value={String(effects.tint ?? '#000000')} onChange={(v) => setFx({ tint: v })} />
          <Range label={`Tint amount — ${Math.round(Number(effects.tint_amount ?? 0) * 100)}%`} min={0} max={80} value={Math.round(Number(effects.tint_amount ?? 0) * 100)} onChange={(v) => setFx({ tint_amount: v / 100 })} />
          <Range label={`Blur — ${Number(effects.blur ?? 0)}px`} min={0} max={20} value={Number(effects.blur ?? 0)} onChange={(v) => setFx({ blur: v })} />
          <Range label={`Vignette — ${Math.round(Number(effects.vignette ?? 0) * 100)}%`} min={0} max={100} value={Math.round(Number(effects.vignette ?? 0) * 100)} onChange={(v) => setFx({ vignette: v / 100 })} />
          <Select label="Gradient" value={String(effects.gradient ?? '')} onChange={(v) => setFx({ gradient: v })} options={['', 'bottom-fade', 'top-fade', 'radial', 'diagonal', 'brand']} />
          <Select label="Text effect" value={String(effects.text_effect ?? 'shadow')} onChange={(v) => setFx({ text_effect: v })} options={['shadow', 'outline', 'glow', 'hard-shadow', 'none']} />
        </div>
      </div>

      <Repeater
        label="Announcements"
        rows={announcements}
        fields={[['title', 'Title'], ['body', 'Message']]}
        onChange={(v) => setContent({ announcements: v })}
      />
    </div>
  )
}

function PatternEditor({
  appId,
  screen,
  content,
  setContent,
}: {
  appId: string
  screen: AppScreen
  content: Record<string, unknown>
  setContent: (patch: Record<string, unknown>) => void
}) {
  const pattern = screenPattern(screen.type)
  const items = Array.isArray(content.items) ? (content.items as Record<string, string>[]) : []
  const images = Array.isArray(content.images) ? (content.images as string[]) : []
  const stats = Array.isArray(content.stats) ? (content.stats as Record<string, string>[]) : []

  if (pattern === 'profile') {
    return (
      <div className="space-y-3">
        <div className="text-sm">
          <span className="block text-xs text-muted-foreground">Image</span>
          <div className="mt-1"><AssetPicker value={String(content.image ?? '')} onChange={(v) => setContent({ image: v })} accept="image/*" /></div>
        </div>
        <Text label="Headline" value={String(content.headline ?? '')} onChange={(v) => setContent({ headline: v })} />
        <Area label="Bio" value={String(content.bio ?? '')} onChange={(v) => setContent({ bio: v })} action={<GenerateButton appId={appId} field="bio" onResult={(t) => setContent({ bio: t })} />} />
        <Repeater label="Stats" rows={stats} fields={[['label', 'Label'], ['value', 'Value']]} onChange={(v) => setContent({ stats: v })} />
        <Area label="Achievements (one per line)" value={String(content.achievements ?? '')} onChange={(v) => setContent({ achievements: v })} action={<GenerateButton appId={appId} field="achievements" onResult={(t) => setContent({ achievements: t })} />} />
      </div>
    )
  }
  if (pattern === 'text')
    return (
      <Area
        label="Body text"
        value={String(content.body ?? '')}
        onChange={(v) => setContent({ body: v })}
        rows={6}
        action={<GenerateButton appId={appId} field={screen.type === 'contact' ? 'contact_intro' : 'about'} onResult={(t) => setContent({ body: t })} />}
      />
    )
  if (pattern === 'web')
    return <Text label="Embedded page URL" value={String(content.url ?? '')} onChange={(v) => setContent({ url: v })} placeholder="https://…" mono />
  if (pattern === 'links') return <Repeater label="Links" rows={items} fields={[['label', 'Label'], ['url', 'URL']]} onChange={(v) => setContent({ items: v })} />
  if (pattern === 'video') return <Repeater label="Videos" rows={items} fields={[['title', 'Title'], ['url', 'Video URL']]} onChange={(v) => setContent({ items: v })} />
  if (pattern === 'gallery') return <ImageList label="Images" images={images} onChange={(v) => setContent({ images: v })} />
  return <Repeater label="Items" rows={items} fields={[['title', 'Title'], ['subtitle', 'Subtitle'], ['detail', 'Detail']]} onChange={(v) => setContent({ items: v })} />
}

/* ---- field primitives ---- */

function Text({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputCls}${mono ? ' font-mono text-xs' : ''}`} />
    </label>
  )
}
function Area({ label, value, onChange, rows = 4, action }: { label: string; value: string; onChange: (v: string) => void; rows?: number; action?: ReactNode }) {
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {action}
      </div>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  )
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o} value={o}>{o || '— none —'}</option>
        ))}
      </select>
    </label>
  )
}
function Range({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-primary" />
    </label>
  )
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9 w-16 rounded border border-border bg-transparent p-0.5" />
    </label>
  )
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  )
}
function ImageList({ label, images, onChange }: { label: string; images: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 space-y-2">
        {images.map((img, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1"><AssetPicker value={img} onChange={(v) => onChange(images.map((x, idx) => (idx === i ? v : x)))} accept="image/*" /></div>
            <button type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))} className="text-destructive">✕</button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onChange([...images, ''])}>+ Add image</Button>
      </div>
    </div>
  )
}
function Repeater({
  label,
  rows,
  fields,
  onChange,
}: {
  label: string
  rows: Record<string, string>[]
  fields: [string, string][]
  onChange: (rows: Record<string, string>[]) => void
}) {
  const update = (i: number, key: string, val: string) => onChange(rows.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)))
  return (
    <div className="text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 space-y-2">
        {rows.map((it, i) => (
          <div key={i} className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-panel/30 p-2">
            <div className="flex-1 space-y-1">
              {fields.map(([key, ph]) => (
                <input key={key} value={it[key] ?? ''} onChange={(e) => update(i, key, e.target.value)} placeholder={ph} className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-xs" />
              ))}
            </div>
            <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} className="text-destructive">✕</button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onChange([...rows, Object.fromEntries(fields.map(([k]) => [k, ''])) as Record<string, string>])}>
          + Add row
        </Button>
      </div>
    </div>
  )
}
