import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatEastern } from '@/lib/format-date'
import { resolveAppTheme } from '@/lib/app-theme'
import type { AppScreen, NavItem } from '@/lib/app-screens'
import { AppConfigClient } from './client'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'App config' }

export default async function AppConfigPage({ params }: PageProps) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('*')
    .eq('id', id)
    .single()
  if (!app || app.user_id !== user.id) notFound()

  const settings = (app.settings ?? {}) as Record<string, unknown>
  const contactEmail = typeof settings.contact_email === 'string' ? settings.contact_email : ''
  const theme = resolveAppTheme(
    settings.theme,
    app.primary_color,
    app.secondary_color,
    (app.theme_mode as 'dark' | 'light') ?? 'dark'
  )
  const nav = Array.isArray(settings.nav) ? (settings.nav as NavItem[]) : []

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/apps"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Apps
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-eyebrow text-accent">App config</p>
            <h1 className="text-display mt-1 text-3xl font-black tracking-tight">{app.name}</h1>
            {app.tagline && <p className="text-sm text-muted-foreground">{app.tagline}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/apps/${app.id}/push`}
              className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-panel"
            >
              🔔 Push
            </Link>
            <Link
              href={`/dashboard/apps/${app.id}/iap`}
              className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-panel"
            >
              💰 IAP
            </Link>
            <a href={`/api/apps/${app.id}/build`}>
              <button className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90">
                ⬇ Download Expo ZIP
              </button>
            </a>
          </div>
        </div>
        {app.last_build_at && (
          <p className="mt-2 text-xs text-muted-foreground">
            Last built {formatEastern(app.last_build_at)}
          </p>
        )}
      </div>

      <AppConfigClient
        app={{
          id: app.id,
          name: app.name,
          tagline: app.tagline ?? '',
          description: app.description ?? '',
          package_id: app.package_id ?? '',
          icon_url: app.icon_url ?? '',
          contact_email: contactEmail,
          theme,
          nav,
          screens: Array.isArray(app.screens) ? (app.screens as AppScreen[]) : [],
          store_listing:
            ((app as { store_listing?: Record<string, unknown> }).store_listing as Record<
              string,
              unknown
            >) ?? {},
        }}
      />
    </div>
  )
}
