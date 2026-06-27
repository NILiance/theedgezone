'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import {
  screenPattern,
  screenEmoji,
  screenCategory,
  screenDef,
  screenTypesByCategory,
  type AppScreen,
  type ScreenTypeDef,
} from '@/lib/app-screens'
import { GenerateButton } from './generate-button'
import { TemplatePicker } from './template-picker'
import { EditorShell } from './editor-shell'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const inputCls = 'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'

/**
 * Screens tab — list of screens with Edit / Preview / Remove, and a full-page
 * editor when Edit is clicked (preview + rail hidden via onEditing). Matches the
 * legacy App Builder.
 */
export function ScreensTab({
  appId,
  screens,
  activeId,
  onScreens,
  onActive,
  onEditing,
  onSave,
}: {
  appId: string
  screens: AppScreen[]
  activeId: string | null
  onScreens: (s: AppScreen[]) => void
  onActive: (id: string) => void
  onEditing: (b: boolean) => void
  onSave: () => void
}) {
  const [picking, setPicking] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const openEditor = (id: string) => {
    setEditingId(id)
    onEditing(true)
  }
  const closeEditor = () => {
    setEditingId(null)
    onEditing(false)
  }

  const add = (def: ScreenTypeDef) => {
    const id = `${def.type}-${Math.random().toString(36).slice(2, 7)}`
    onScreens([...screens, { id, title: def.defaultTitle, icon: def.icon, type: def.type, content: clone(def.defaultContent) }])
    onActive(id)
    setPicking(false)
    openEditor(id)
  }
  const patch = (id: string, p: Partial<AppScreen>) => onScreens(screens.map((sc) => (sc.id === id ? { ...sc, ...p } : sc)))
  const remove = (id: string) => onScreens(screens.filter((sc) => sc.id !== id))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= screens.length) return
    const next = [...screens]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    onScreens(next)
  }

  // ── Full-page editor ──
  const editing = editingId ? screens.find((s) => s.id === editingId) : null
  if (editing) {
    return (
      <EditorShell
        title={`Edit ${screenDef(editing.type)?.label ?? editing.title}`}
        icon={screenEmoji(editing.icon)}
        backLabel="← Back to Screens"
        onBack={closeEditor}
        onSave={() => {
          onSave()
          closeEditor()
        }}
      >
        <ScreenForm appId={appId} screen={editing} onChange={(p) => patch(editing.id, p)} />
      </EditorShell>
    )
  }

  // ── Empty → templates ──
  if (screens.length === 0 && !picking) {
    return (
      <TemplatePicker
        onApply={(s) => {
          onScreens(s)
          if (s[0]) onActive(s[0].id)
        }}
        onScratch={() => setPicking(true)}
      />
    )
  }

  // ── List ──
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-display text-2xl font-black">Screens</h2>
          <p className="text-xs text-muted-foreground">Reorder with the arrows — this is the order in your app.</p>
        </div>
        <Button size="sm" onClick={() => setPicking((v) => !v)}>{picking ? 'Close' : '+ Add Screen'}</Button>
      </div>

      {picking && (
        <div className="space-y-3 rounded-[var(--radius)] border border-border bg-panel/40 p-3">
          {screenTypesByCategory().map((grp) => (
            <div key={grp.category}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-primary">{grp.category}</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {grp.defs.map((def) => (
                  <button key={def.type} type="button" onClick={() => add(def)} className="rounded-[var(--radius-sm)] border border-border bg-panel-elevated/40 p-2 text-left hover:border-primary/40">
                    <p className="text-display text-xs font-bold">{screenEmoji(def.icon)} {def.label}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{def.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {screens.map((sc, i) => {
          const isHome = sc.type === 'home'
          return (
            <div key={sc.id} className="flex items-center gap-2.5 rounded-[var(--radius)] border border-border bg-panel/40 p-3">
              {isHome ? (
                <span className="text-display rounded-[var(--radius-sm)] bg-panel-elevated px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Home</span>
              ) : (
                <span className="flex flex-col leading-none text-muted-foreground">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === screens.length - 1} className="disabled:opacity-30">↓</button>
                </span>
              )}
              <span className="text-lg">{screenEmoji(sc.icon)}</span>
              <span className="min-w-0 flex-1">
                <span className="text-display block truncate font-bold">{sc.title}</span>
                <span className="block text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{screenCategory(sc.type)}</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => openEditor(sc.id)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => onActive(sc.id)}>Preview</Button>
              {!isHome && (
                <button type="button" onClick={() => remove(sc.id)} className="text-display px-2 text-xs font-bold uppercase tracking-widest text-destructive">Remove</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────── screen editors ─────────────────────────── */

function ScreenForm({ appId, screen, onChange }: { appId: string; screen: AppScreen; onChange: (patch: Partial<AppScreen>) => void }) {
  const content = (screen.content ?? {}) as Record<string, unknown>
  const setContent = (patch: Record<string, unknown>) => onChange({ content: { ...content, ...patch } })
  const pattern = screenPattern(screen.type)

  return (
    <div className="space-y-4">
      <Card title="Screen">
        <label className="block text-sm">
          <span className="block text-xs text-muted-foreground">Screen title (tab label)</span>
          <input value={screen.title} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
        </label>
      </Card>

      {screen.type === 'home' ? (
        <HomeEditor content={content} setContent={setContent} />
      ) : pattern === 'profile' ? (
        <ProfileEditor appId={appId} content={content} setContent={setContent} />
      ) : (
        <PatternEditor appId={appId} screen={screen} content={content} setContent={setContent} />
      )}
    </div>
  )
}

function ProfileEditor({ appId, content, setContent }: { appId: string; content: Record<string, unknown>; setContent: (p: Record<string, unknown>) => void }) {
  const stats = Array.isArray(content.stats) ? (content.stats as Record<string, string>[]) : []
  return (
    <>
      <Card title="Photo">
        <AssetPicker value={String(content.image ?? '')} onChange={(v) => setContent({ image: v })} accept="image/*" />
      </Card>
      <Card title="Bio" action={<GenerateButton appId={appId} field="bio" onResult={(t) => setContent({ bio: t })} />}>
        <textarea rows={5} value={String(content.bio ?? '')} onChange={(e) => setContent({ bio: e.target.value })} placeholder="Tell your story…" className={inputCls} />
      </Card>
      <Card title="Details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Text label="Height" value={String(content.height ?? '')} onChange={(v) => setContent({ height: v })} placeholder={`6'2"`} />
          <Text label="Weight" value={String(content.weight ?? '')} onChange={(v) => setContent({ weight: v })} placeholder="185 lbs" />
          <Text label="Hometown" value={String(content.hometown ?? '')} onChange={(v) => setContent({ hometown: v })} placeholder="Dallas, TX" />
          <Text label="Class" value={String(content.class_year ?? '')} onChange={(v) => setContent({ class_year: v })} placeholder="2025" />
        </div>
      </Card>
      <Card title="Stats">
        <Repeater rows={stats} fields={[['label', 'Label'], ['value', 'Value']]} addLabel="+ Add Stat" onChange={(v) => setContent({ stats: v })} />
      </Card>
      <Card title="Achievements" action={<GenerateButton appId={appId} field="achievements" onResult={(t) => setContent({ achievements: t })} />}>
        <textarea rows={4} value={String(content.achievements ?? '')} onChange={(e) => setContent({ achievements: e.target.value })} placeholder="One achievement per line…" className={inputCls} />
      </Card>
    </>
  )
}

function HomeEditor({ content, setContent }: { content: Record<string, unknown>; setContent: (patch: Record<string, unknown>) => void }) {
  const splash = Array.isArray(content.splash_images) ? (content.splash_images as string[]) : []
  const effects = (content.effects ?? {}) as Record<string, unknown>
  const announcements = Array.isArray(content.announcements) ? (content.announcements as Record<string, string>[]) : []
  const setFx = (p: Record<string, unknown>) => setContent({ effects: { ...effects, ...p } })

  return (
    <>
      <Card title="Splash">
        <ImageList images={splash} onChange={(v) => setContent({ splash_images: v })} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Text label="Name on splash" value={String(content.heading ?? '')} onChange={(v) => setContent({ heading: v })} placeholder="Defaults to app name" />
          <Select label="Name style" value={String(content.name_style ?? 'bold')} onChange={(v) => setContent({ name_style: v })} options={['bold', 'condensed', 'script', 'serif', 'minimal', 'display', 'modern', 'urban', 'luxury', 'retro', 'tech', 'handwritten']} />
          <Range label={`Name size — ${Number(content.name_size ?? 100)}%`} min={50} max={200} value={Number(content.name_size ?? 100)} onChange={(v) => setContent({ name_size: v })} />
          <Select label="Name position" value={String(content.name_position ?? 'center')} onChange={(v) => setContent({ name_position: v })} options={['center', 'top', 'upper-third', 'lower-third', 'bottom']} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <Check label="Show name" checked={content.show_name !== false} onChange={(v) => setContent({ show_name: v })} />
          <Check label="Show nav grid" checked={content.show_nav_grid !== false} onChange={(v) => setContent({ show_nav_grid: v })} />
        </div>
      </Card>
      <Card title="Splash effects">
        <div className="grid gap-3 sm:grid-cols-2">
          <Color label="Tint" value={String(effects.tint ?? '#000000')} onChange={(v) => setFx({ tint: v })} />
          <Range label={`Tint — ${Math.round(Number(effects.tint_amount ?? 0) * 100)}%`} min={0} max={80} value={Math.round(Number(effects.tint_amount ?? 0) * 100)} onChange={(v) => setFx({ tint_amount: v / 100 })} />
          <Range label={`Blur — ${Number(effects.blur ?? 0)}px`} min={0} max={20} value={Number(effects.blur ?? 0)} onChange={(v) => setFx({ blur: v })} />
          <Range label={`Vignette — ${Math.round(Number(effects.vignette ?? 0) * 100)}%`} min={0} max={100} value={Math.round(Number(effects.vignette ?? 0) * 100)} onChange={(v) => setFx({ vignette: v / 100 })} />
          <Select label="Gradient" value={String(effects.gradient ?? '')} onChange={(v) => setFx({ gradient: v })} options={['', 'bottom-fade', 'top-fade', 'radial', 'diagonal', 'brand']} />
          <Select label="Text effect" value={String(effects.text_effect ?? 'shadow')} onChange={(v) => setFx({ text_effect: v })} options={['shadow', 'outline', 'glow', 'hard-shadow', 'none']} />
        </div>
      </Card>
      <Card title="Announcements">
        <Repeater rows={announcements} fields={[['title', 'Title'], ['body', 'Message']]} addLabel="+ Add announcement" onChange={(v) => setContent({ announcements: v })} />
      </Card>
    </>
  )
}

function PatternEditor({ appId, screen, content, setContent }: { appId: string; screen: AppScreen; content: Record<string, unknown>; setContent: (patch: Record<string, unknown>) => void }) {
  const pattern = screenPattern(screen.type)
  const items = Array.isArray(content.items) ? (content.items as Record<string, string>[]) : []
  const images = Array.isArray(content.images) ? (content.images as string[]) : []

  if (pattern === 'text') {
    return (
      <Card title={screen.type === 'contact' ? 'Contact' : 'Body'} action={<GenerateButton appId={appId} field={screen.type === 'contact' ? 'contact_intro' : 'about'} onResult={(t) => setContent({ body: t })} />}>
        <textarea rows={8} value={String(content.body ?? '')} onChange={(e) => setContent({ body: e.target.value })} className={inputCls} />
      </Card>
    )
  }
  if (pattern === 'web') {
    return (
      <Card title="Embedded page">
        <input value={String(content.url ?? '')} onChange={(e) => setContent({ url: e.target.value })} placeholder="https://…" className={`${inputCls} font-mono text-xs`} />
      </Card>
    )
  }
  if (pattern === 'gallery') {
    return (
      <Card title="Images">
        <ImageList images={images} onChange={(v) => setContent({ images: v })} />
      </Card>
    )
  }
  const fields: [string, string][] = pattern === 'links' ? [['label', 'Label'], ['url', 'URL']] : pattern === 'video' ? [['title', 'Title'], ['url', 'URL']] : [['title', 'Title'], ['subtitle', 'Subtitle'], ['detail', 'Detail']]
  return (
    <Card title="Items">
      <Repeater rows={items} fields={fields} addLabel="+ Add row" onChange={(v) => setContent({ items: v })} />
    </Card>
  )
}

/* ─────────────────────────── primitives ─────────────────────────── */

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-display font-bold">{title}</p>
        {action}
      </div>
      {children}
    </section>
  )
}
function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  )
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (<option key={o} value={o}>{o || '— none —'}</option>))}
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
function ImageList({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      {images.map((img, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1"><AssetPicker value={img} onChange={(v) => onChange(images.map((x, idx) => (idx === i ? v : x)))} accept="image/*" /></div>
          <button type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))} className="text-destructive">✕</button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...images, ''])}>+ Add image</Button>
    </div>
  )
}
function Repeater({ rows, fields, addLabel, onChange }: { rows: Record<string, string>[]; fields: [string, string][]; addLabel: string; onChange: (rows: Record<string, string>[]) => void }) {
  const update = (i: number, key: string, val: string) => onChange(rows.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)))
  return (
    <div className="space-y-2">
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
      <Button size="sm" variant="outline" onClick={() => onChange([...rows, Object.fromEntries(fields.map(([k]) => [k, ''])) as Record<string, string>])}>{addLabel}</Button>
    </div>
  )
}
