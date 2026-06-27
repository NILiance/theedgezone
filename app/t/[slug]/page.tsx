import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { nilianceProfileUrl, slugify } from '@/lib/niliance-urls'
import { computeNilfluence } from '@/lib/nilfluence'
import { autoPopularityFromProfile } from '@/lib/nilfluence-autocalc'
import { getResolvedSocial } from '@/lib/nilfluence-server'
import { BrandRoiCalculator } from './brand-roi'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = createServiceClient()
  if (!supabase) return { title: slug }
  const userId = await resolveUserId(supabase, slug)
  if (!userId) return { title: slug }
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, sport')
    .eq('id', userId)
    .maybeSingle()
  return {
    title: profile?.display_name ?? slug,
    description: profile?.sport ? `${profile.display_name} · ${profile.sport}` : undefined,
  }
}

/**
 * Resolves a public slug to a user_id. Order of resolution:
 *   1. sites.slug = slug (most common — talents publish a site)
 *   2. epks.slug = slug
 *   3. profiles.display_name slugified equals slug
 */
async function resolveUserId(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  slug: string
): Promise<string | null> {
  const { data: site } = await supabase.from('sites').select('user_id').eq('slug', slug).maybeSingle()
  if (site?.user_id) return site.user_id
  const { data: epk } = await supabase.from('epks').select('user_id').eq('slug', slug).maybeSingle()
  if (epk?.user_id) return epk.user_id
  // Fallback — flatten display_name and look for a match. Not unique, but
  // good enough when no site/EPK exists.
  const target = slug.replace(/-/g, '').toLowerCase()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .limit(50)
  const hit = (profiles ?? []).find(
    (p) =>
      (p.display_name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') === target
  )
  return hit?.id ?? null
}

export default async function PublicTalentProfile({ params }: PageProps) {
  const { slug } = await params
  const supabase = createServiceClient()
  if (!supabase) notFound()
  const userId = await resolveUserId(supabase, slug)
  if (!userId) notFound()

  const [{ data: profile }, { data: latestScore }, { data: site }, { data: epk }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'display_name, avatar_url, sport, athletic_position, school, conference, jersey_number, hometown, city, us_state, height_inches, weight_lbs, bio, achievements, brand_tagline, brand_primary_color, socials'
        )
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('nilfluence_calculations')
        .select('result, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('sites').select('slug, status').eq('user_id', userId).eq('status', 'published').maybeSingle(),
      supabase.from('epks').select('slug, status').eq('user_id', userId).eq('status', 'published').maybeSingle(),
    ])

  if (!profile) notFound()

  // Affiliations live in a column added by a later migration — fetch separately
  // so the page still works if that migration hasn't been applied yet.
  let affiliations: Array<{ organization?: string; role?: string }> = []
  try {
    const { data: affRow } = await supabase
      .from('profiles')
      .select('affiliations')
      .eq('id', userId)
      .maybeSingle()
    const raw = (affRow as { affiliations?: unknown } | null)?.affiliations
    if (Array.isArray(raw)) affiliations = raw as Array<{ organization?: string; role?: string }>
  } catch {
    // Column not present yet — skip.
  }

  // NILiance "View Full Profile" link — uses the LISTING slug+uuid when synced,
  // else the user uuid (legacy fallback). Fetched resiliently.
  let nilianceProfileHref: string | null = null
  try {
    const withRef = await supabase
      .from('profiles')
      .select('niliance_listing_id, niliance_listing_slug, niliance_user_id')
      .eq('id', userId)
      .maybeSingle()
    type NRef = {
      niliance_listing_id?: string | null
      niliance_listing_slug?: string | null
      niliance_user_id?: string | null
    }
    const r = (withRef.error ? null : withRef.data) as NRef | null
    const ref: NRef | null =
      r ??
      ((
        await supabase.from('profiles').select('niliance_user_id').eq('id', userId).maybeSingle()
      ).data as NRef | null)
    const nameSlug = slugify(profile.display_name ?? '')
    if (ref?.niliance_listing_id) {
      nilianceProfileHref = nilianceProfileUrl(ref.niliance_listing_slug || nameSlug, ref.niliance_listing_id)
    } else if (ref?.niliance_user_id) {
      nilianceProfileHref = nilianceProfileUrl(nameSlug, ref.niliance_user_id)
    }
  } catch {
    // skip
  }

  const savedNil = (
    latestScore?.result as {
      nilfluence?: {
        nilfluence_score?: number
        total_followers?: number
        total_engagement_rate?: number
        approximate_post_value?: number
      }
    } | null
  )?.nilfluence

  let score = savedNil?.nilfluence_score
  let followers = savedNil?.total_followers
  let er = savedNil?.total_engagement_rate
  let postValue = savedNil?.approximate_post_value

  // No saved calculation yet — compute a baseline from the profile + any
  // cached social stats so the profile always shows a score.
  if (score == null) {
    // Social: Phyllo first, then the talent's manual Profile → Social numbers.
    const social = await getResolvedSocial(supabase, userId)
    const auto = autoPopularityFromProfile(
      profile as Parameters<typeof autoPopularityFromProfile>[0]
    )
    const fb = computeNilfluence({
      instagram: social.instagram,
      tiktok: social.tiktok,
      twitter: social.twitter,
      youtube: social.youtube,
      athlete_popularity: auto.athlete,
      team_popularity: auto.team,
      market_size: auto.market,
      adjustment_factor: Math.round(Math.min(48, auto.athlete * 0.4)),
    })
    score = fb.nilfluence_score
    followers = fb.total_followers
    er = fb.total_engagement_rate
    postValue = fb.approximate_post_value
  }

  const socials = (profile.socials as Record<string, string> | null) ?? {}
  const primary = profile.brand_primary_color ?? '#E63946'

  const heightIn = profile.height_inches as number | null
  const height = heightIn ? `${Math.floor(heightIn / 12)}'${heightIn % 12}"` : null
  const location = [profile.city, profile.us_state].filter(Boolean).join(', ')
  const vitals: Array<{ label: string; value: string }> = [
    ['Sport', profile.sport],
    ['Position', profile.athletic_position],
    ['School', profile.school],
    ['Conference', profile.conference],
    ['Jersey', profile.jersey_number ? `#${profile.jersey_number}` : null],
    ['Hometown', profile.hometown],
    ['Location', location || null],
    ['Height', height],
    ['Weight', profile.weight_lbs ? `${profile.weight_lbs} lbs` : null],
  ]
    .filter(([, v]) => Boolean(v))
    .map(([label, value]) => ({ label: label as string, value: String(value) }))

  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="flex flex-wrap items-start gap-5">
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? ''}
                  className="h-28 w-28 rounded-full border-4 object-cover"
                  style={{ borderColor: primary }}
                />
              )}
              <div>
                <p className="text-eyebrow text-primary">Talent profile</p>
                <h1 className="text-display mt-2 text-4xl font-black tracking-tight">
                  {profile.display_name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[profile.athletic_position, profile.sport, profile.school]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {profile.brand_tagline && (
                  <p className="text-display mt-3 text-lg font-bold italic" style={{ color: primary }}>
                    &ldquo;{profile.brand_tagline}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {vitals.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {vitals.map((v) => (
                  <div
                    key={v.label}
                    className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {v.label}
                    </p>
                    <p className="text-display mt-0.5 text-sm font-bold">{v.value}</p>
                  </div>
                ))}
              </div>
            )}

            {profile.bio && (
              <div className="mt-8">
                <p className="text-eyebrow text-primary">About</p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              </div>
            )}

            {profile.achievements && (
              <div className="mt-6">
                <p className="text-eyebrow text-primary">Achievements</p>
                <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {profile.achievements}
                </p>
              </div>
            )}

            {affiliations.filter((a) => a?.organization).length > 0 && (
              <div className="mt-6">
                <p className="text-eyebrow text-primary">Affiliations</p>
                <ul className="mt-2 space-y-1.5">
                  {affiliations
                    .filter((a) => a?.organization)
                    .map((a, i) => (
                      <li key={`${a.organization}-${i}`} className="text-sm text-muted-foreground">
                        <span className="text-display font-bold text-foreground">
                          {a.organization}
                        </span>
                        {a.role ? ` · ${a.role}` : ''}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {Object.values(socials).some(Boolean) && (
              <div className="mt-6">
                <p className="text-eyebrow text-primary">Connect</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(socials)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <a
                        key={k}
                        href={v}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-display rounded-full border border-border bg-panel/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest hover:border-primary/40"
                      >
                        {k}
                      </a>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {site && (
                <Link
                  href={`/site/${site.slug}`}
                  className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground"
                >
                  Visit site →
                </Link>
              )}
              {epk && (
                <Link
                  href={`/epk/${epk.slug}`}
                  className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-5 py-2 text-sm font-bold uppercase tracking-widest"
                >
                  Press kit →
                </Link>
              )}
              {nilianceProfileHref && (
                <a
                  href={nilianceProfileHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-display rounded-[var(--radius-sm)] px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground"
                  style={{ background: primary }}
                >
                  View Full Profile on NILiance ↗
                </a>
              )}
            </div>
          </div>

          {/* Score sidebar */}
          <aside>
            <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-6 shadow-elevated">
              <p className="text-eyebrow text-muted-foreground">NILfluence Score</p>
              <div className="mt-3 flex justify-center">
                {score != null ? (
                  <ScoreRing score={score} size={180} label="NILfluence" />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-full border-2 border-dashed border-border text-center text-xs text-muted-foreground">
                    No score yet
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
                {followers != null && (
                  <p>
                    Reach{' '}
                    <span className="text-display font-bold text-foreground">
                      {followers.toLocaleString()}
                    </span>
                  </p>
                )}
                {er != null && (
                  <p>
                    Engagement rate{' '}
                    <span className="text-display font-bold text-foreground">
                      {(er * 100).toFixed(2)}%
                    </span>
                  </p>
                )}
                {postValue != null && (
                  <p>
                    Approx. post value{' '}
                    <span className="text-display font-bold text-primary">
                      ${postValue.toFixed(0)}
                    </span>
                  </p>
                )}
              </div>
              {score != null && (
                <BrandRoiCalculator
                  name={profile.display_name ?? 'this athlete'}
                  followers={followers ?? 0}
                  er={er ?? 0}
                  postValue={postValue ?? 0}
                />
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
