import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CalculatorForm } from './form'

export const metadata = { title: 'NILfluence Calculator' }

export default async function NilfluenceCalculatorPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('socials')
    .eq('id', user.id)
    .maybeSingle()
  const socials = (profile?.socials as Record<string, string> | null) ?? {}

  const { data: recent } = await supabase
    .from('nilfluence_calculations')
    .select('id, result, niliance_synced_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <p className="text-eyebrow mt-3 text-accent">NILfluence Calculator</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
          Your NIL value, scored.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Plug in your social numbers and a few popularity dimensions. We&apos;ll calculate your
          NILfluence Score, suggest a per-post value, and (optionally) push the result over to
          NILiance so brands can see it.
        </p>
        {Object.values(socials).some(Boolean) && (
          <p className="mt-2 text-xs text-muted-foreground">
            Tip: you already have socials on your profile — we&apos;ll cross-reference them when
            we submit.
          </p>
        )}
      </div>

      <CalculatorForm />

      {(recent ?? []).length > 0 && (
        <section>
          <p className="text-eyebrow mb-3 text-primary">Recent calculations</p>
          <div className="space-y-2">
            {(recent ?? []).map((r) => {
              const score = (r.result as { nilfluence?: { nilfluence_score?: number } } | null)
                ?.nilfluence?.nilfluence_score
              const bms = (r.result as { bms?: { bms_100?: number } } | null)?.bms?.bms_100
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-panel/40 p-4 text-sm"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1">
                      NILfluence{' '}
                      <span className="text-display font-bold text-primary">
                        {score?.toFixed(1) ?? '—'}
                      </span>
                      {bms != null && (
                        <>
                          {' '}
                          · BMS{' '}
                          <span className="text-display font-bold text-accent">
                            {bms.toFixed(1)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {r.niliance_synced_at ? (
                    <span className="text-display rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success">
                      Sent to NILiance
                    </span>
                  ) : (
                    <span className="text-display rounded-full bg-panel-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Local only
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
