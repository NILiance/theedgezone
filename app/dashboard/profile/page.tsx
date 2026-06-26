import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditor, type SectionKey } from '@/components/dashboard/profile-editor'
import { PhylloConnectCard } from '@/components/dashboard/phyllo-connect-card'
import {
  NilianceConnectButton,
  NilianceSyncButton,
  PublicProfileButtons,
} from './integration-buttons'

export const metadata = { title: 'Profile' }

const SECTION_KEYS: SectionKey[] = [
  'basics',
  'athletic',
  'brand',
  'story',
  'social',
  'contacts',
  'goals',
]

interface PageProps {
  searchParams: Promise<{ section?: string }>
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const { section } = await searchParams
  const initialSection: SectionKey =
    section && SECTION_KEYS.includes(section as SectionKey)
      ? (section as SectionKey)
      : 'basics'

  const user = await requireUser()
  const supabase = await createClient()
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  let p = profile ?? ({} as Record<string, unknown>)

  // NILiance link state. "Linked" covers the 409 case where the account
  // exists but no UUID was stored — the pull resolves the id by email.
  const nilStatus = String(p.niliance_link_status ?? '')
  const isNilianceLinked =
    Boolean(p.niliance_user_id) || ['linked', 'pending', 'error'].includes(nilStatus)

  // Auto-pull from NILiance: if linked but the profile is still empty, fill it
  // in on load (one round-trip; stops once there's data). The cron also does
  // this in the background.
  const profileIsSparse = !p.sport && !p.school && !p.bio
  let nilianceDiag: string | null = null
  if (isNilianceLinked && profileIsSparse) {
    try {
      const { pullProfileFromNiliance } = await import('@/lib/niliance')
      const res = await pullProfileFromNiliance({ userId: user.id })
      if (res.ok && res.fields) {
        const refetched = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        if (refetched.data) {
          profile = refetched.data
          p = refetched.data
        }
      } else if (res.ok) {
        nilianceDiag =
          'Connected to NILiance, but no profile fields were found to import — your NILiance profile may be empty, or its field names differ from what we expect. Check Admin → NILiance → Recent events.'
      } else {
        nilianceDiag = res.error ?? 'NILiance sync did not run.'
      }
    } catch (err) {
      nilianceDiag = err instanceof Error ? err.message : 'NILiance sync error.'
    }
  }
  const socials = (p.socials as Record<string, string>) ?? {}
  const selected_goals = (p.selected_goals as string[]) ?? []

  // Public-profile link (/t/<slug>). Prefer a site or EPK slug; fall back to
  // a slugified display name (which the /t resolver also matches on).
  const [sitesRes, epksRes] = await Promise.all([
    supabase.from('sites').select('slug').eq('user_id', user.id).limit(1),
    supabase.from('epks').select('slug').eq('user_id', user.id).limit(1),
  ])
  const publicSlug =
    (sitesRes.data?.[0]?.slug as string | undefined) ||
    (epksRes.data?.[0]?.slug as string | undefined) ||
    String(p.display_name ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const sectionPercents = computeSectionPercents(p, socials)
  const overall = (p.profile_completion_pct as number | undefined) ?? 0

  const ready = {
    brandDesign: sectionPercents.brand >= 50 && sectionPercents.basics >= 50,
    epk: sectionPercents.story >= 50 && sectionPercents.basics >= 50,
    website: sectionPercents.basics >= 50 && sectionPercents.athletic >= 50,
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-eyebrow text-accent">Your Profile</p>
            <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
              Edit your details
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes sync to NILiance automatically.
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-panel/60 p-4 shadow-elevated">
            <p className="text-display text-4xl font-black text-primary">{overall}%</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Profile Complete
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ReadinessChip label="Ready for Brand Design" active={ready.brandDesign} />
          <ReadinessChip label="Ready for EPK" active={ready.epk} />
          <ReadinessChip label="Ready for Website" active={ready.website} />
        </div>
      </div>

      <ProfileEditor
        initialSection={initialSection}
        sectionPercents={sectionPercents}
        profile={{
          display_name: (p.display_name as string | null) ?? null,
          avatar_url: (p.avatar_url as string | null) ?? null,
          email: user.email ?? '',
          phone: (p.phone as string | null) ?? null,
          street_address: (p.street_address as string | null) ?? null,
          city: (p.city as string | null) ?? null,
          us_state: (p.us_state as string | null) ?? null,
          website_url: (p.website_url as string | null) ?? null,
          weight_lbs: (p.weight_lbs as number | null) ?? null,
          hometown: (p.hometown as string | null) ?? null,
          height_inches: (p.height_inches as number | null) ?? null,
          sport: (p.sport as string | null) ?? null,
          athletic_position: (p.athletic_position as string | null) ?? null,
          school: (p.school as string | null) ?? null,
          conference: (p.conference as string | null) ?? null,
          division: (p.division as string | null) ?? null,
          jersey_number: (p.jersey_number as string | null) ?? null,
          date_of_birth: (p.date_of_birth as string | null) ?? null,
          brand_primary_color: (p.brand_primary_color as string | null) ?? null,
          brand_secondary_color: (p.brand_secondary_color as string | null) ?? null,
          brand_accent_color: (p.brand_accent_color as string | null) ?? null,
          brand_neutral_color: (p.brand_neutral_color as string | null) ?? null,
          brand_tagline: (p.brand_tagline as string | null) ?? null,
          brand_voice: (p.brand_voice as string | null) ?? null,
          brand_style_seed: (p.brand_style_seed as string | null) ?? null,
          brand_mood: (p.brand_mood as string | null) ?? null,
          brand_audience: (p.brand_audience as string | null) ?? null,
          brand_font_pair: (p.brand_font_pair as string | null) ?? null,
          brand_values: ((p.brand_values as string[] | null) ?? []),
          brand_inspiration_urls: ((p.brand_inspiration_urls as string[] | null) ?? []),
          brand_avoid: (p.brand_avoid as string | null) ?? null,
          brand_initials: (p.brand_initials as string | null) ?? null,
          brand_vibe: (p.brand_vibe as string | null) ?? null,
          brand_bg_pref: (p.brand_bg_pref as string | null) ?? null,
          brand_elements: (p.brand_elements as string | null) ?? null,
          brand_include_name: (p.brand_include_name as boolean | null) ?? null,
          brand_include_initials: (p.brand_include_initials as boolean | null) ?? null,
          brand_include_jersey: (p.brand_include_jersey as boolean | null) ?? null,
          bio: (p.bio as string | null) ?? null,
          achievements: (p.achievements as string | null) ?? null,
          socials,
          selected_goals,
          agency_name: (p.agency_name as string | null) ?? null,
          agent_name: (p.agent_name as string | null) ?? null,
          agent_email: (p.agent_email as string | null) ?? null,
          agent_phone: (p.agent_phone as string | null) ?? null,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PhylloConnectCard
          connected={Boolean(p.phyllo_user_id)}
          connectedAt={(p.phyllo_connected_at as string | null) ?? null}
        />
        <div className="rounded-[var(--radius)] border border-border bg-panel/60 p-6 shadow-elevated">
          <p className="text-eyebrow text-primary">NILiance</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isNilianceLinked
              ? 'Connected. Your NILiance profile data is pulled in automatically — or sync it now.'
              : "Connect to manage opportunities, get paid through NILiance, and have your profile data sync automatically. Don't have an account? We'll auto-create one when you save your profile."}
          </p>
          {isNilianceLinked ? <NilianceSyncButton /> : <NilianceConnectButton />}
          {nilianceDiag && (
            <p className="mt-2 text-[11px] leading-relaxed text-accent">{nilianceDiag}</p>
          )}
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-panel/60 p-6 shadow-elevated">
          <p className="text-eyebrow text-primary">Public Profile</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Share a clean public page that aggregates your Edge Zone profile and your NILiance
            offerings.
          </p>
          <PublicProfileButtons slug={publicSlug} />
        </div>
      </div>
    </div>
  )
}

function ReadinessChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`text-display rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
        active ? 'bg-success/20 text-success' : 'bg-panel-elevated text-muted-foreground'
      }`}
    >
      {active ? '✓ ' : '○ '}
      {label}
    </span>
  )
}

function computeSectionPercents(
  p: Record<string, unknown>,
  socials: Record<string, string>
): Record<SectionKey, number> {
  const basicsFields = [
    p.display_name,
    p.phone,
    p.street_address,
    p.city,
    p.us_state,
    p.website_url,
    p.weight_lbs,
    p.hometown,
    p.height_inches,
    p.avatar_url,
  ]
  const athleticFields = [
    p.sport,
    p.athletic_position,
    p.school,
    p.conference,
    p.division,
    p.jersey_number,
    p.date_of_birth,
  ]
  const brandFields = [
    p.brand_primary_color,
    p.brand_secondary_color,
    p.brand_tagline,
    p.brand_voice,
  ]
  const storyFields = [p.bio, p.achievements]
  const socialFields = ['instagram', 'tiktok', 'twitter', 'youtube'].map(
    (k) => socials[k]
  )
  const contactsFields = [
    p.agency_name,
    p.agent_name,
    p.agent_email,
    p.agent_phone,
  ]
  const goalsFilled = ((p.selected_goals as string[]) ?? []).length

  const pct = (filled: number, total: number) =>
    total === 0 ? 0 : Math.round((filled / total) * 100)
  const filled = (xs: unknown[]) =>
    xs.filter((v) => v !== null && v !== undefined && v !== '').length

  return {
    basics: pct(filled(basicsFields), basicsFields.length),
    athletic: pct(filled(athleticFields), athleticFields.length),
    brand: pct(filled(brandFields), brandFields.length),
    story: pct(filled(storyFields), storyFields.length),
    social: pct(filled(socialFields), socialFields.length),
    contacts: pct(filled(contactsFields), contactsFields.length),
    goals: goalsFilled > 0 ? Math.min(100, goalsFilled * 20) : 0,
  }
}
