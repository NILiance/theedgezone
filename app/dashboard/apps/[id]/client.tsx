'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAppSettings, updateAppBuild } from '../actions'
import { type AppScreen, type NavItem, screenDef } from '@/lib/app-screens'
import type { AppTheme } from '@/lib/app-theme'
import { type DeviceId, DEFAULT_DEVICE } from '@/lib/app-devices'
import type { AppExtension } from '@/lib/app-extensions'
import { AppPreview, autoNav } from '@/components/apps/app-preview'
import { DesignTab } from './design-tab'
import { ScreensTab } from './screens-tab'
import { NavigationTab } from './navigation-tab'
import { SubmissionTab } from './submission-tab'
import { PublishTab } from './publish-tab'
import { ExtensionsTab } from './extensions-tab'
import { EarningsTab } from './earnings-tab'
import { NewsTab, MediaTab, EventsTab } from './content-tabs'
import { ShopTab, FansTab } from './commerce-tabs'
import { type AppCommerce, resolveCommerce } from '@/lib/app-commerce'
import type { AppIntegrations } from '@/lib/app-integrations'

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
  extensions: string[]
  commerce: unknown
  integrations: unknown
  store_listing: Record<string, unknown>
  earnings: Record<string, number>
  payout: { method?: string; handle?: string }
}

type Tab =
  | 'screens'
  | 'design'
  | 'navigation'
  | 'news'
  | 'media'
  | 'events'
  | 'shop'
  | 'fans'
  | 'extensions'
  | 'settings'
  | 'submission'
  | 'earnings'
  | 'publish'

const TAB_GROUPS: { group: string; tabs: { id: Tab; label: string }[] }[] = [
  { group: 'Build', tabs: [{ id: 'screens', label: '📱 Screens' }, { id: 'design', label: '🎨 Design' }, { id: 'navigation', label: '≡ Navigation' }] },
  { group: 'Content', tabs: [{ id: 'news', label: '📰 News' }, { id: 'media', label: '🎬 Media' }, { id: 'events', label: '📅 Events' }] },
  { group: 'Commerce', tabs: [{ id: 'shop', label: '🛒 Shop' }, { id: 'fans', label: '⭐ Fans' }] },
  { group: 'Extend', tabs: [{ id: 'extensions', label: '🧩 Extensions' }] },
  {
    group: 'Settings',
    tabs: [
      { id: 'settings', label: '⚙ Settings' },
      { id: 'submission', label: '📋 Store' },
      { id: 'earnings', label: '💰 Earnings' },
      { id: 'publish', label: '🚀 Publish' },
    ],
  },
]

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

export function AppConfigClient({ app }: { app: App }) {
  const [tab, setTab] = useState<Tab>('screens')
  const [theme, setTheme] = useState<AppTheme>(() => clone(app.theme))
  const [screens, setScreens] = useState<AppScreen[]>(() => clone(app.screens))
  const [nav, setNav] = useState<NavItem[]>(() => (app.nav.length ? clone(app.nav) : autoNav(app.screens)))
  const [extensions, setExtensions] = useState<string[]>(() => clone(app.extensions ?? []))
  const [commerce, setCommerce] = useState<AppCommerce>(() => resolveCommerce(app.commerce))
  const [integrations, setIntegrations] = useState<AppIntegrations>(
    () => (app.integrations && typeof app.integrations === 'object' ? (app.integrations as AppIntegrations) : {})
  )
  const [iconUrl, setIconUrl] = useState(app.icon_url)
  const [activeId, setActiveId] = useState<string | null>(() => app.screens[0]?.id ?? null)
  const [device, setDevice] = useState<DeviceId>(DEFAULT_DEVICE)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const FORM_TABS = ['settings', 'submission', 'publish']
  const needsSave = !FORM_TABS.includes(tab) && tab !== 'earnings'

  const saveBuild = () => {
    setStatus(null)
    const fd = new FormData()
    fd.set('app_id', app.id)
    fd.set('theme', JSON.stringify(theme))
    fd.set('nav', JSON.stringify(nav))
    fd.set('screens', JSON.stringify(screens))
    fd.set('extensions', JSON.stringify(extensions))
    fd.set('commerce', JSON.stringify(commerce))
    fd.set('integrations', JSON.stringify(integrations))
    fd.set('icon_url', iconUrl)
    startTransition(async () => {
      const res = await updateAppBuild(fd)
      setStatus(res.ok ? 'Saved.' : res.message ?? 'Save failed')
    })
  }

  // Install/uninstall an extension; installing one that carries a screen adds it.
  const toggleExtension = (ext: AppExtension, install: boolean) => {
    setExtensions((prev) => (install ? Array.from(new Set([...prev, ext.id])) : prev.filter((id) => id !== ext.id)))
    const screenType = ext.screen
    if (install && screenType) {
      setScreens((prev) => {
        if (prev.some((s) => s.type === screenType)) return prev
        const def = screenDef(screenType)
        if (!def) return prev
        const id = `${screenType}-${Math.random().toString(36).slice(2, 7)}`
        return [...prev, { id, title: def.defaultTitle, icon: def.icon, type: def.type, content: clone(def.defaultContent) }]
      })
    }
  }

  const tabContent = (
    <>
      {tab === 'design' && <DesignTab theme={theme} onChange={(p) => setTheme((t) => ({ ...t, ...p }))} iconUrl={iconUrl} onIcon={setIconUrl} />}
      {tab === 'screens' && (
        <ScreensTab appId={app.id} screens={screens} activeId={activeId} onScreens={setScreens} onActive={setActiveId} onEditing={setEditing} onSave={saveBuild} />
      )}
      {tab === 'navigation' && <NavigationTab screens={screens} nav={nav} onChange={setNav} />}
      {tab === 'news' && <NewsTab screens={screens} onScreens={setScreens} onEditing={setEditing} onSave={saveBuild} />}
      {tab === 'media' && <MediaTab screens={screens} onScreens={setScreens} />}
      {tab === 'events' && <EventsTab screens={screens} onScreens={setScreens} onEditing={setEditing} onSave={saveBuild} />}
      {tab === 'shop' && <ShopTab commerce={commerce} onChange={setCommerce} onEditing={setEditing} onSave={saveBuild} />}
      {tab === 'fans' && <FansTab commerce={commerce} onChange={setCommerce} screens={screens} />}
      {tab === 'extensions' && (
        <ExtensionsTab
          installed={extensions}
          onToggle={toggleExtension}
          integrations={integrations}
          onIntegration={(id, url) => setIntegrations((p) => ({ ...p, [id]: { url } }))}
        />
      )}
      {tab === 'earnings' && <EarningsTab appId={app.id} earnings={app.earnings} payout={app.payout} />}
    </>
  )

  return (
    <div className="space-y-4">
      {!editing && (
        <div className="flex flex-wrap gap-2">
          {TAB_GROUPS.map((g) => (
            <div key={g.group} className="rounded-[var(--radius)] border border-border bg-panel/40 p-1.5">
              <p className="pb-1 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{g.group}</p>
              <div className="flex gap-1">
                {g.tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`text-display whitespace-nowrap rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-bold transition-colors ${
                      tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-panel hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {FORM_TABS.includes(tab) ? (
        tab === 'settings' ? (
          <SettingsTab app={app} />
        ) : tab === 'publish' ? (
          <PublishTab appId={app.id} appName={app.name} packageId={app.package_id} theme={theme} storeListing={app.store_listing} />
        ) : (
          <SubmissionTab appId={app.id} storeListing={app.store_listing} />
        )
      ) : (
        // tabContent stays in a stable tree position so the active tab never
        // remounts when `editing` toggles — only the wrapper class + the preview
        // sibling change.
        <div className={editing ? 'min-w-0' : 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'}>
          <div className="min-w-0 space-y-4">
            {tabContent}
            {!editing && needsSave && (
              <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-border bg-background/95 py-3 backdrop-blur">
                <Button onClick={saveBuild} disabled={isPending}>{isPending ? 'Saving…' : 'Save app'}</Button>
                {status && <p className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}>{status}</p>}
              </div>
            )}
          </div>
          {!editing && (
            <div>
              <div className="lg:sticky lg:top-6">
                <AppPreview theme={theme} appName={app.name} iconUrl={iconUrl} screens={screens} nav={nav} activeId={activeId} onSelect={setActiveId} device={device} onDevice={setDevice} />
                <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">Live preview</p>
              </div>
            </div>
          )}
        </div>
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
