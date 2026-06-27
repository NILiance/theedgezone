import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LocalTime } from '@/components/ui/local-time'
import { autoPopularityFromProfile } from '@/lib/nilfluence-autocalc'
import { getResolvedSocial } from '@/lib/nilfluence-server'
import { CalculatorForm } from './form'

export const metadata = { title: 'NILfluence Calculator' }

export default async function NilfluenceCalculatorPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, sport, athletic_position, school, conference, division, jersey_number, hometown, city, us_state, bio, achievements, socials, phyllo_user_id'
    )
    .eq('id', user.id)
    .maybeSingle()
  const profileLike = (profile ?? {}) as Parameters<typeof autoPopularityFromProfile>[0]
  const autoPop = autoPopularityFromProfile(profileLike)
  // Social numbers, Phyllo-first then the talent's Profile→Social input, to
  // seed the calculator so it matches the score on their profile.
  const seedSocial = await getResolvedSocial(supabase, user.id)

  // Pull the most recent calculation to hydrate the form with prior inputs.
  const { data: latest } = await supabase
    .from('nilfluence_calculations')
    .select('inputs, result, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: recent } = await supabase
    .from('nilfluence_calculations')
    .select('id, result, niliance_synced_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const lastInputs =
    (latest?.inputs as Record<string, unknown> | null)?.nilfluence ?? null
  const lastBms = (latest?.inputs as Record<string, unknown> | null)?.bms ?? null
  // Auto-estimate the four contextual inputs on load only when the talent
  // hasn't saved their own values yet (don't clobber prior overrides).
  const hasSavedPopularity =
    !!lastInputs && (lastInputs as Record<string, unknown>).athlete_popularity != null

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
          Plug in your social numbers. We pre-fill popularity inputs from your profile so the
          first score is meaningful; tweak any number to refine. Save the result and brands can see
          it through NILiance.
        </p>
      </div>

      <CalculatorForm
        lastInputs={lastInputs as Record<string, unknown> | null}
        lastBms={lastBms as Record<string, unknown> | null}
        autoPopularity={autoPop}
        autoCalc={!hasSavedPopularity}
        seedSocial={seedSocial}
      />

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
                      <LocalTime value={r.created_at} mode="datetime" />
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
