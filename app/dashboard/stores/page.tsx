import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createStore } from './actions'

export const metadata = { title: 'My stores' }

export default async function StoresIndexPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: stores } = await supabase
    .from('stores')
    .select('id, slug, name, tagline, status, primary_color, secondary_color, created_at')
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
          <p className="text-eyebrow mt-3 text-accent">NIL Stores</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">Your stores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Merch storefronts at <code>/store/&lt;slug&gt;</code>. Stripe checkout; 15% platform
            fee routed via your Connect account.
          </p>
        </div>
        <form action={createStore}>
          <Button type="submit" size="lg">
            + New store
          </Button>
        </form>
      </div>

      {(!stores || stores.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No stores yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <strong>+ New store</strong> to scaffold a draft pre-filled from your profile.
            </p>
          </CardContent>
        </Card>
      )}

      {stores && stores.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <Card key={s.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <div
                  className="mb-3 h-2 w-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${s.primary_color}, ${s.secondary_color})`,
                  }}
                />
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <span
                    className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      s.status === 'open'
                        ? 'bg-success/20 text-success'
                        : 'bg-panel-elevated text-muted-foreground'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                {s.tagline && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.tagline}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/stores/${s.id}`}>
                    <Button size="sm">Manage</Button>
                  </Link>
                  {s.status === 'open' ? (
                    <Link href={`/store/${s.slug}`} target="_blank">
                      <Button size="sm" variant="outline">
                        View live
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/store/${s.slug}?preview=1`} target="_blank">
                      <Button size="sm" variant="outline">
                        Preview
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
