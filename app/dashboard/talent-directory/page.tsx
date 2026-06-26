import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth'
import { slugify, nilianceEditUrl } from '@/lib/niliance-urls'

export const metadata = { title: 'Talent Directory' }

interface PageProps {
  searchParams: Promise<{ q?: string; sport?: string }>
}

export default async function TalentDirectoryPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { user, userType, isAdmin } = await getUserContext()
  if (!user) redirect('/sign-in?next=/dashboard/talent-directory')
  if (userType !== 'brand' && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-eyebrow text-accent">Brand accounts only</p>
        <h1 className="text-display mt-3 text-2xl font-black">This page is for brands</h1>
        <p className="mt-3 text-muted-foreground">
          The Talent Directory lets brands discover talent. Talent users browse{' '}
          <Link href="/opportunities" className="text-primary hover:underline">
            Opportunities
          </Link>{' '}
          instead.
        </p>
      </div>
    )
  }

  const supabase = createServiceClient()
  const rows = supabase
    ? (
        await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, sport, school')
          .eq('user_type', 'talent')
          .not('display_name', 'is', null)
          .order('display_name', { ascending: true })
          .limit(300)
      ).data ?? []
    : []

  const sports = Array.from(
    new Set(rows.map((r) => (r.sport as string | null)?.trim()).filter(Boolean) as string[])
  ).sort()

  const q = (sp.q ?? '').trim().toLowerCase()
  const sportFilter = sp.sport ?? ''
  const talent = rows.filter((r) => {
    if (q && !(r.display_name ?? '').toLowerCase().includes(q)) return false
    if (sportFilter && (r.sport ?? '') !== sportFilter) return false
    return true
  })

  // Where a brand goes to post: their own NILiance listing editor (falls back to
  // NILiance profile settings when no listing is synced).
  let postUrl = nilianceEditUrl()
  if (supabase && user) {
    const { data: me } = await supabase
      .from('profiles')
      .select('niliance_listing_slug, niliance_listing_id')
      .eq('id', user.id)
      .maybeSingle()
    postUrl = nilianceEditUrl(
      (me as { niliance_listing_slug?: string } | null)?.niliance_listing_slug ?? null,
      (me as { niliance_listing_id?: string } | null)?.niliance_listing_id ?? null
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Talent Directory</p>
          <h1 className="text-display mt-1 text-2xl font-black tracking-tight">
            Browse {rows.length} talent
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find talent and view their full profile on NILiance.
          </p>
        </div>
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
        >
          + Post an opportunity on NILiance ↗
        </a>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-panel/40 p-3">
        <input
          name="q"
          defaultValue={sp.q ?? ''}
          placeholder="Search by name"
          className="min-w-[200px] flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          name="sport"
          defaultValue={sportFilter}
          className="h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
        >
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
        >
          Filter
        </button>
      </form>

      {talent.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-border bg-panel/40 px-4 py-12 text-center text-sm text-muted-foreground">
          {q || sportFilter
            ? 'No talent match your filters.'
            : 'No talent profiles yet.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {talent.map((t) => {
            const slug = slugify(t.display_name ?? '')
            return (
              <Link
                key={t.id}
                href={`/t/${slug}`}
                className="group overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40 transition-colors hover:border-primary/40"
              >
                <div className="flex aspect-square items-center justify-center bg-panel-elevated">
                  {t.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.avatar_url}
                      alt={t.display_name ?? ''}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-display text-4xl font-black text-muted-foreground">
                      {(t.display_name ?? '?').slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-display truncate font-bold group-hover:text-primary">
                    {t.display_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[t.sport, t.school].filter(Boolean).join(' · ') || 'Talent'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
