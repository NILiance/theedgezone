import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { LogoModForm } from './form'
import { InstantRemix } from './instant-remix'

export const metadata = { title: 'Logo Mod' }

export default async function LogoModPage() {
  const user = await requireUser()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const [{ data: profile }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('display_name, brand_primary_color').eq('id', user.id).maybeSingle(),
    supabase
      .from('logo_mod_requests')
      .select('id, original_logo_url, requested_changes, tier, status, amount_cents, delivered_logo_urls, created_at, delivered_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <p className="text-eyebrow mt-3 text-accent">Logo Mod</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
          Tweak your existing logo
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Already have a logo? Remix it instantly below — recolor, simplify, sharpen — pick a
          variation and it&apos;s yours. Prefer a human designer instead? That option&apos;s here too.
        </p>
      </div>

      <InstantRemix />

      <section>
        <p className="text-eyebrow mb-3 text-muted-foreground">Prefer a human designer?</p>
        <LogoModForm />
      </section>

      {(requests ?? []).length > 0 && (
        <section>
          <p className="text-eyebrow mb-3 text-primary">Your requests</p>
          <div className="space-y-3">
            {(requests ?? []).map((r) => {
              const deliveredLogos = (r.delivered_logo_urls as string[]) ?? []
              const tone =
                r.status === 'delivered'
                  ? 'bg-success/20 text-success'
                  : r.status === 'cancelled'
                  ? 'bg-destructive/20 text-destructive'
                  : 'bg-accent/20 text-accent'
              return (
                <div key={r.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-display font-bold">{r.requested_changes.slice(0, 100)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()} · {r.tier} tier · $
                        {(r.amount_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  {deliveredLogos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {deliveredLogos.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-display rounded-[var(--radius-sm)] border border-success/40 bg-success/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-success"
                        >
                          Download v{i + 1} →
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {profile && (
        <p className="text-xs text-muted-foreground">
          Logged in as {profile.display_name ?? user.email}
        </p>
      )}
    </div>
  )
}
