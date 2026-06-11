import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSite } from '@/app/dashboard/sites/actions'

export const metadata = { title: 'Sites' }

export default async function SitesIndexPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: sites } = await supabase
    .from('sites')
    .select('id, slug, display_name, status, published_at, created_at')
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
          <p className="text-eyebrow mt-3 text-accent">Talent Sites</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
            Your sites
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-page personal websites published at{' '}
            <span className="text-display text-foreground">yourname.MyTalentSite.com</span>.
          </p>
        </div>
        <form action={createSite}>
          <Button type="submit" size="lg">
            + New site
          </Button>
        </form>
      </div>

      {(!sites || sites.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No sites yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <strong>+ New site</strong> to scaffold a draft. Pre-fills colors + bio from
              your profile.
            </p>
          </CardContent>
        </Card>
      )}

      {sites && sites.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {site.display_name ?? site.slug}
                  </CardTitle>
                  <span
                    className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      site.status === 'published'
                        ? 'bg-success/20 text-success'
                        : 'bg-panel-elevated text-muted-foreground'
                    }`}
                  >
                    {site.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {site.slug}.mytalentsite.com
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/sites/${site.id}`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                  <Link href={`/site/${site.slug}`} target="_blank">
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
