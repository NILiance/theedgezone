'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAppSettings, updateAppBuild } from '../actions'
import type { AppScreen, NavItem } from '@/lib/app-screens'
import type { AppTheme } from '@/lib/app-theme'
import { AppPreview, autoNav } from '@/components/apps/app-preview'
import { DesignTab } from './design-tab'
import { ScreensTab } from './screens-tab'
import { NavigationTab } from './navigation-tab'
import { SubmissionTab } from './submission-tab'
import { PublishTab } from './publish-tab'

interface App {
  id: string
  name: string
  tagline: string
  description: string
  package_id: string
  icon_url: string
  contact_email: string
  theme: AppTheme
  nav: NavItem[]
  screens: AppScreen[]
  store_listing: Record<string, unknown>
}

type Tab = 'design' | 'screens' | 'navigation' | 'settings' | 'submission' | 'publish'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

export function AppConfigClient({ app }: { app: App }) {
  const [tab, setTab] = useState<Tab>('design')
  const [theme, setTheme] = useState<AppTheme>(() => clone(app.theme))
  const [screens, setScreens] = useState<AppScreen[]>(() => clone(app.screens))
  const [nav, setNav] = useState<NavItem[]>(() => (app.nav.length ? clone(app.nav) : autoNav(app.screens)))
  const [iconUrl, setIconUrl] = useState(app.icon_url)
  const [activeId, setActiveId] = useState<string | null>(() => app.screens[0]?.id ?? null)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const isBuild = tab === 'design' || tab === 'screens' || tab === 'navigation'

  const saveBuild = () => {
    setStatus(null)
    const fd = new FormData()
    fd.set('app_id', app.id)
    fd.set('theme', JSON.stringify(theme))
    fd.set('nav', JSON.stringify(nav))
    fd.set('screens', JSON.stringify(screens))
    fd.set('icon_url', iconUrl)
    startTransition(async () => {
      const res = await updateAppBuild(fd)
      setStatus(res.ok ? 'Saved.' : res.message ?? 'Save failed')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['design', 'Design'],
            ['screens', `Screens (${screens.length})`],
            ['navigation', 'Navigation'],
            ['settings', 'Settings'],
            ['submission', 'Store submission'],
            ['publish', 'Publish'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              tab === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isBuild ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            {tab === 'design' && (
              <DesignTab theme={theme} onChange={(p) => setTheme((t) => ({ ...t, ...p }))} iconUrl={iconUrl} onIcon={setIconUrl} />
            )}
            {tab === 'screens' && (
              <ScreensTab appId={app.id} screens={screens} activeId={activeId} onScreens={setScreens} onActive={setActiveId} />
            )}
            {tab === 'navigation' && <NavigationTab screens={screens} nav={nav} onChange={setNav} />}

            <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-border bg-background/95 py-3 backdrop-blur">
              <Button onClick={saveBuild} disabled={isPending}>
                {isPending ? 'Saving…' : 'Save app'}
              </Button>
              {status && (
                <p className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}>{status}</p>
              )}
            </div>
          </div>

          <div>
            <div className="lg:sticky lg:top-6">
              <AppPreview
                theme={theme}
                appName={app.name}
                iconUrl={iconUrl}
                screens={screens}
                nav={nav}
                activeId={activeId}
                onSelect={setActiveId}
              />
              <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                Live preview · tap a tab
              </p>
            </div>
          </div>
        </div>
      ) : tab === 'settings' ? (
        <SettingsTab app={app} />
      ) : tab === 'publish' ? (
        <PublishTab
          appId={app.id}
          appName={app.name}
          packageId={app.package_id}
          theme={theme}
          storeListing={app.store_listing}
        />
      ) : (
        <SubmissionTab appId={app.id} storeListing={app.store_listing} />
      )}
    </div>
  )
}

function SettingsTab({ app }: { app: App }) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setStatus(null)
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
          <Input id="package_id" name="package_id" defaultValue={app.package_id} required placeholder="com.yourname.app" />
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
          <Label htmlFor="contact_email">Contact email (privacy policy)</Label>
          <Input id="contact_email" name="contact_email" type="email" defaultValue={app.contact_email} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Colors, fonts, and the app icon live in the <strong>Design</strong> tab.
      </p>
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save settings'}
        </Button>
        {status && <p className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}>{status}</p>}
      </div>
    </form>
  )
}
