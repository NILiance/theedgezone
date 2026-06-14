'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { updateAppSettings, updateAppScreens } from '../actions'

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

function ScreensTab({ app }: { app: App }) {
  const [json, setJson] = useState(JSON.stringify(app.screens, null, 2))
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const save = () => {
    setStatus(null)
    const fd = new FormData()
    fd.set('app_id', app.id)
    fd.set('screens', json)
    startTransition(async () => {
      const res = await updateAppScreens(fd)
      setStatus(res.ok ? 'Saved.' : res.message ?? 'Save failed')
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Edit the screens array as JSON. Each screen is{' '}
        <code>{`{ id, title, icon, type, content }`}</code>. Supported types include{' '}
        <code>home</code>, <code>list</code>, <code>text</code>, <code>web</code>,{' '}
        <code>profile</code>, <code>tip</code>. The generated Expo project renders each screen
        as a separate JS file under <code>src/screens/</code>.
      </p>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={20}
        className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
      />
      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save screens'}
        </Button>
        {status && (
          <p
            className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  )
}
