'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { updateAppSettings, updateAppScreens } from '../actions'
import { SCREEN_TYPES, screenDef, screenPattern, type ScreenTypeDef } from '@/lib/app-screens'

interface App {
  id: string
  name: string
  tagline: string
  description: string
  package_id: string
  icon_url: string
  primary_color: string
  secondary_color: string
  theme_mode: 'dark' | 'light'
  contact_email: string
  screens: Array<{
    id: string
    title: string
    icon?: string
    type: string
    content?: Record<string, unknown>
  }>
}

export function AppConfigClient({ app }: { app: App }) {
  const [section, setSection] = useState<'settings' | 'screens'>('settings')
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['settings', 'Settings'],
            ['screens', `Screens (${app.screens.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              section === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'settings' && <SettingsTab app={app} />}
      {section === 'screens' && <ScreensTab app={app} />}
    </div>
  )
}

function SettingsTab({ app }: { app: App }) {
  const [iconUrl, setIconUrl] = useState(app.icon_url)
  const [primary, setPrimary] = useState(app.primary_color)
  const [secondary, setSecondary] = useState(app.secondary_color)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setStatus(null)
    fd.set('icon_url', iconUrl)
    fd.set('primary_color', primary)
    fd.set('secondary_color', secondary)
    startTransition(async () => {
      const res = await updateAppSettings(fd)
      setStatus(res.ok ? 'Saved.' : res.message ?? 'Save failed')
    })
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="app_id" value={app.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">App name</Label>
          <Input id="name" name="name" defaultValue={app.name} required />
        </div>
        <div>
          <Label htmlFor="package_id">Bundle / package ID</Label>
          <Input
            id="package_id"
            name="package_id"
            defaultValue={app.package_id}
            required
            placeholder="com.yourname.app"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" name="tagline" defaultValue={app.tagline} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description (store listing)</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={app.description}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Icon (1024×1024 PNG recommended)</Label>
          <AssetPicker value={iconUrl} onChange={setIconUrl} accept="image/png,image/jpeg" />
        </div>
        <div>
          <Label>Primary color</Label>
          <Input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-10 w-20 p-1"
          />
        </div>
        <div>
          <Label>Secondary color</Label>
          <Input
            type="color"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            className="h-10 w-20 p-1"
          />
        </div>
        <div>
          <Label htmlFor="theme_mode">Theme mode</Label>
          <select
            id="theme_mode"
            name="theme_mode"
            defaultValue={app.theme_mode}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <Label htmlFor="contact_email">Contact email (privacy policy)</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={app.contact_email}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save settings'}
        </Button>
        {status && (
          <p
            className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}
          >
            {status}
          </p>
        )}
      </div>
    </form>
  )
}

interface AppScreen {
  id: string
  title: string
  icon?: string
  type: string
  content?: Record<string, unknown>
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

function ScreensTab({ app }: { app: App }) {
  const [screens, setScreens] = useState<AppScreen[]>(() => clone(app.screens as AppScreen[]))
  const [editing, setEditing] = useState<number | null>(null)
  const [picking, setPicking] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const save = () => {
    setStatus(null)
    const fd = new FormData()
    fd.set('app_id', app.id)
    fd.set('screens', JSON.stringify(screens))
    startTransition(async () => {
      const res = await updateAppScreens(fd)
      setStatus(res.ok ? 'Saved.' : res.message ?? 'Save failed')
    })
  }

  const addScreen = (def: ScreenTypeDef) => {
    const id = `${def.type}-${Math.random().toString(36).slice(2, 7)}`
    setScreens((s) => [
      ...s,
      { id, title: def.defaultTitle, icon: def.icon, type: def.type, content: clone(def.defaultContent) },
    ])
    setPicking(false)
    setEditing(screens.length)
  }
  const patchScreen = (i: number, patch: Partial<AppScreen>) =>
    setScreens((s) => s.map((sc, idx) => (idx === i ? { ...sc, ...patch } : sc)))
  const removeScreen = (i: number) => {
    setScreens((s) => s.filter((_, idx) => idx !== i))
    setEditing(null)
  }
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= screens.length) return
    setScreens((s) => {
      const next = [...s]
      ;[next[i], next[j]] = [next[j]!, next[i]!]
      return next
    })
    if (editing === i) setEditing(j)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Build your app screen by screen. Each becomes a tab in the generated app.
        </p>
        <Button size="sm" variant="outline" onClick={() => setPicking((v) => !v)}>
          {picking ? 'Close' : '+ Add screen'}
        </Button>
      </div>

      {picking && (
        <div className="grid grid-cols-2 gap-2 rounded-[var(--radius)] border border-border bg-panel/40 p-3 sm:grid-cols-3 lg:grid-cols-4">
          {SCREEN_TYPES.map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => addScreen(def)}
              className="rounded-[var(--radius-sm)] border border-border bg-panel-elevated/40 p-2 text-left hover:border-primary/40"
            >
              <p className="text-display text-xs font-bold">{def.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{def.description}</p>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {screens.map((sc, i) => (
          <div key={sc.id} className="rounded-[var(--radius)] border border-border bg-panel/40">
            <div className="flex items-center gap-2 p-3">
              <span className="text-display rounded-[var(--radius-sm)] bg-panel-elevated px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {screenDef(sc.type)?.label ?? sc.type}
              </span>
              <p className="text-display flex-1 truncate font-bold">{sc.title}</p>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-muted-foreground disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === screens.length - 1} className="px-1 text-muted-foreground disabled:opacity-30">↓</button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(editing === i ? null : i)}>
                {editing === i ? 'Close' : 'Edit'}
              </Button>
              <button type="button" onClick={() => removeScreen(i)} className="px-2 text-destructive">✕</button>
            </div>
            {editing === i && (
              <div className="border-t border-border p-3">
                <ScreenForm screen={sc} onChange={(p) => patchScreen(i, p)} />
              </div>
            )}
          </div>
        ))}
        {screens.length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No screens yet. Add your first above.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button onClick={save} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save screens'}
        </Button>
        {status && (
          <p className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  )
}

function ScreenForm({
  screen,
  onChange,
}: {
  screen: AppScreen
  onChange: (patch: Partial<AppScreen>) => void
}) {
  const pattern = screenPattern(screen.type)
  const content = (screen.content ?? {}) as Record<string, unknown>
  const setContent = (patch: Record<string, unknown>) =>
    onChange({ content: { ...content, ...patch } })
  const inputCls = 'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'

  const items = Array.isArray(content.items) ? (content.items as Record<string, string>[]) : []
  const images = Array.isArray(content.images) ? (content.images as string[]) : []

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="block text-xs text-muted-foreground">Screen title (tab label)</span>
        <input value={screen.title} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
      </label>

      {pattern === 'profile' && (
        <>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Headline</span>
            <input value={(content.headline as string) ?? ''} onChange={(e) => setContent({ headline: e.target.value })} className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Bio</span>
            <textarea rows={4} value={(content.bio as string) ?? ''} onChange={(e) => setContent({ bio: e.target.value })} className={inputCls} />
          </label>
          <div className="text-sm">
            <span className="block text-xs text-muted-foreground">Image</span>
            <div className="mt-1">
              <AssetPicker value={(content.image as string) ?? ''} onChange={(v) => setContent({ image: v })} accept="image/*" />
            </div>
          </div>
        </>
      )}

      {pattern === 'text' && (
        <label className="block text-sm">
          <span className="block text-xs text-muted-foreground">Body text</span>
          <textarea rows={6} value={(content.body as string) ?? ''} onChange={(e) => setContent({ body: e.target.value })} className={inputCls} />
        </label>
      )}

      {pattern === 'web' && (
        <label className="block text-sm">
          <span className="block text-xs text-muted-foreground">Embedded page URL</span>
          <input value={(content.url as string) ?? ''} onChange={(e) => setContent({ url: e.target.value })} placeholder="https://…" className={`${inputCls} font-mono text-xs`} />
        </label>
      )}

      {pattern === 'links' && (
        <ItemRows items={items} fields={[['label', 'Label'], ['url', 'URL']]} onChange={(v) => setContent({ items: v })} />
      )}
      {pattern === 'video' && (
        <ItemRows items={items} fields={[['title', 'Title'], ['url', 'Video URL']]} onChange={(v) => setContent({ items: v })} />
      )}
      {pattern === 'list' && (
        <ItemRows items={items} fields={[['title', 'Title'], ['subtitle', 'Subtitle'], ['detail', 'Detail']]} onChange={(v) => setContent({ items: v })} />
      )}

      {pattern === 'gallery' && (
        <div className="space-y-2">
          <span className="block text-xs text-muted-foreground">Images</span>
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <AssetPicker value={img} onChange={(v) => setContent({ images: images.map((x, idx) => (idx === i ? v : x)) })} accept="image/*" />
              </div>
              <button type="button" onClick={() => setContent({ images: images.filter((_, idx) => idx !== i) })} className="text-destructive">✕</button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setContent({ images: [...images, ''] })}>+ Add image</Button>
        </div>
      )}
    </div>
  )
}

function ItemRows({
  items,
  fields,
  onChange,
}: {
  items: Record<string, string>[]
  fields: [string, string][]
  onChange: (items: Record<string, string>[]) => void
}) {
  const update = (i: number, key: string, val: string) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)))
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-panel/30 p-2">
          <div className="flex-1 space-y-1">
            {fields.map(([key, label]) => (
              <input
                key={key}
                value={it[key] ?? ''}
                onChange={(e) => update(i, key, e.target.value)}
                placeholder={label}
                className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-xs"
              />
            ))}
          </div>
          <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-destructive">✕</button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...items, Object.fromEntries(fields.map(([k]) => [k, ''])) as Record<string, string>])}>
        + Add row
      </Button>
    </div>
  )
}
