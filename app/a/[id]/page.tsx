import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveAppTheme } from '@/lib/app-theme'
import { resolveCommerce } from '@/lib/app-commerce'
import type { AppScreen, NavItem } from '@/lib/app-screens'
import { applyFeeds } from '@/lib/app-feeds'
import { PublicApp } from '@/components/apps/public-app'

export const dynamic = 'force-dynamic'

interface AppRow {
  id: string
  name: string
  icon_url: string | null
  primary_color: string
  secondary_color: string
  theme_mode: string
  screens: unknown
  settings: unknown
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function loadApp(idOrSlug: string): Promise<AppRow | null> {
  const supabase = createServiceClient()
  if (!supabase) return null
  // Path-served (/a/{uuid}) uses the id; subdomain ({slug}.appsfortalent.com)
  // resolves by slug.
  const col = UUID_RE.test(idOrSlug) ? 'id' : 'slug'
  const { data } = await supabase
    .from('talent_apps')
    .select('id, name, icon_url, primary_color, secondary_color, theme_mode, screens, settings')
    .eq(col, idOrSlug)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as AppRow | null) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const app = await loadApp(id)
  if (!app) return { title: 'App' }
  return {
    title: app.name,
    manifest: `/a/${id}/app.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: app.name },
    icons: app.icon_url ? { icon: app.icon_url, apple: app.icon_url } : undefined,
  }
}

export default async function PublicAppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = await loadApp(id)
  if (!app) notFound()

  const settings = (app.settings ?? {}) as Record<string, unknown>
  const theme = resolveAppTheme(settings.theme, app.primary_color, app.secondary_color, app.theme_mode as 'dark' | 'light')
  const screens = Array.isArray(app.screens) ? (app.screens as AppScreen[]) : []
  const nav = Array.isArray(settings.nav) ? (settings.nav as NavItem[]) : []
  const commerce = resolveCommerce(settings.commerce)
  const integrations = (settings.integrations ?? {}) as Record<string, { url?: string }>
  const screensWithFeeds = await applyFeeds(screens, integrations)

  return (
    <PublicApp
      appId={app.id}
      theme={theme}
      appName={app.name}
      iconUrl={app.icon_url ?? undefined}
      screens={screensWithFeeds}
      nav={nav}
      products={commerce.products}
    />
  )
}
