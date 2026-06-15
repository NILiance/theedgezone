import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createEpk } from './actions'
import { BuildFromPicker } from '@/components/dashboard/build-from-picker'

export const metadata = { title: 'My EPKs' }

export default async function EpksIndexPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: epks } = await supabase
    .from('epks')
    .select('id, slug, display_name, tagline, status, published_at, created_at')
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
          <p className="text-eyebrow mt-3 text-accent">Electronic Press Kits</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">Your EPKs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Media-ready one-page pitch at{' '}
            <span className="text-display text-foreground">yourname.talentepk.com</span>.
          </p>
        </div>
        <BuildFromPicker
          action={createEpk}
          what="EPK"
          profileSections={['name', 'sport', 'position', 'school', 'brand colors']}
          triggerLabel="+ New EPK"
        />
      </div>

      {(!epks || epks.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No EPKs yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <strong>+ New EPK</strong> to scaffold a draft pre-filled from your profile.
            </p>
          </CardContent>
        </Card>
      )}

      {epks && epks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {epks.map((epk) => (
            <Card key={epk.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{epk.display_name ?? epk.slug}</CardTitle>
                  <span
                    className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      epk.status === 'published'
                        ? 'bg-success/20 text-success'
                        : 'bg-panel-elevated text-muted-foreground'
                    }`}
                  >
                    {epk.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {epk.slug}.talentepk.com
                </p>
              </CardHeader>
              <CardContent>
                {epk.tagline && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{epk.tagline}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/dashboard/epks/${epk.id}`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                  <Link href={`/epk/${epk.slug}`} target="_blank">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
