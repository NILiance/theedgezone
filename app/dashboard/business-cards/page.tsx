import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BuildFromPicker } from '@/components/dashboard/build-from-picker'
import { createBusinessCard } from './actions'

export const metadata = { title: 'Digital business cards' }

export default async function BusinessCardsIndexPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: cards } = await supabase
    .from('digital_business_cards')
    .select('id, slug, display_name, title, status, view_count, created_at')
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
          <p className="text-eyebrow mt-3 text-accent">Digital business cards</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">Your cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One link, one tap — instant contact saved to anyone&apos;s phone. Generate a QR for
            print.
          </p>
        </div>
        <BuildFromPicker
          action={createBusinessCard}
          what="Card"
          profileSections={['name', 'title', 'school', 'colors', 'phone', 'website', 'socials']}
          triggerLabel="+ New card"
        />
      </div>

      {(!cards || cards.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>No cards yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <strong>+ New card</strong> to scaffold one. Build From My Profile pulls your
              name, position, school, brand colors, and socials — Start From Scratch leaves
              everything blank for you to fill in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{c.display_name ?? c.slug}</CardTitle>
                  <span
                    className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      c.status === 'published'
                        ? 'bg-success/20 text-success'
                        : 'bg-panel-elevated text-muted-foreground'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                {c.title && (
                  <p className="mt-1 text-xs text-muted-foreground">{c.title}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  /card/{c.slug} · {c.view_count} views
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/dashboard/business-cards/${c.id}`}
                    className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1 font-bold uppercase tracking-widest"
                  >
                    Edit →
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
