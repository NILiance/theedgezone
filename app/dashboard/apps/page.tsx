import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createApp } from './actions'
import { BuildFromPicker } from '@/components/dashboard/build-from-picker'

export const metadata = { title: 'My apps' }

export default async function AppsIndexPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: apps } = await supabase
    .from('talent_apps')
    .select('id, slug, name, tagline, status, last_build_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <p className="text-eyebrow mt-3 text-accent">Mobile apps</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">Your apps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure here, download the Expo project, hand it to a dev or submit yourself.
          </p>
        </div>
        <BuildFromPicker
          action={createApp}
          what="App"
          profileSections={['name', 'sport', 'brand colors']}
          triggerLabel="+ New app"
        />
      </div>

      {(!apps || apps.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No apps yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <strong>+ New app</strong> to scaffold one pre-filled from your profile.
            </p>
          </CardContent>
        </Card>
      )}

      {apps && apps.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Card key={app.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{app.name}</CardTitle>
                  <span
                    className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      app.status === 'ready' || app.status === 'published'
                        ? 'bg-success/20 text-success'
                        : 'bg-panel-elevated text-muted-foreground'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                {app.tagline && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{app.tagline}</p>
                )}
              </CardHeader>
              <CardContent>
                {app.last_build_at && (
                  <p className="text-xs text-muted-foreground">
                    Last built {new Date(app.last_build_at).toLocaleDateString()}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/dashboard/apps/${app.id}`}>
                    <Button size="sm">Configure</Button>
                  </Link>
                  <a href={`/api/apps/${app.id}/build`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      Download Expo ZIP
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
