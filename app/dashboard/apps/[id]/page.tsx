import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
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
          <a href={`/api/apps/${app.id}/build`}>
            <button className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90">
              ⬇ Download Expo ZIP
            </button>
          </a>
        </div>
        {app.last_build_at && (
          <p className="mt-2 text-xs text-muted-foreground">
            Last built {new Date(app.last_build_at).toLocaleString()}
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
          primary_color: app.primary_color,
          secondary_color: app.secondary_color,
          theme_mode: (app.theme_mode as 'dark' | 'light') ?? 'dark',
          contact_email: contactEmail,
          screens: Array.isArray(app.screens)
            ? (app.screens as Array<{
                id: string
                title: string
                icon?: string
                type: string
                content?: Record<string, unknown>
              }>)
            : [],
        }}
      />
    </div>
  )
}
