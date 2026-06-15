import Link from 'next/link'
import { SECTION_LABELS, sectionsForSlug, type ProfileSectionKey } from '@/lib/profile-sections-by-product'

interface Order {
  product_slug: string
  product_title: string | null
  created_at: string
}

interface Props {
  order: Order
  /** Per-section % already completed, 0-100 each. */
  sectionPercents: Partial<Record<ProfileSectionKey, number>>
}

/**
 * Surfaces on the dashboard right after a purchase, prompting the user to
 * complete the profile sections most relevant to provisioning the product
 * they bought. Dismisses automatically when those sections hit 80%+.
 */
export function PostPurchaseBanner({ order, sectionPercents }: Props) {
  const sections = sectionsForSlug(order.product_slug)
  const sectionStatus = sections.map((s) => ({
    key: s,
    label: SECTION_LABELS[s],
    pct: sectionPercents[s] ?? 0,
  }))
  const overallReady = sectionStatus.every((s) => s.pct >= 80)
  if (overallReady) return null

  return (
    <div className="rounded-[var(--radius)] border border-primary/40 bg-primary/5 p-6 shadow-elevated">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-eyebrow text-primary">Just purchased</p>
          <h3 className="text-display mt-1 text-xl font-black">
            {order.product_title ?? 'Your new service'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We highly recommend taking 5 minutes to finish the profile sections below — the more
            we know, the more we can pre-build for you. You can still choose <em>Start From
            Scratch</em> in the product editor either way.
          </p>
        </div>
        <Link
          href="/dashboard/profile"
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
        >
          Finish profile →
        </Link>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {sectionStatus.map((s) => (
          <Link
            key={s.key}
            href={`/dashboard/profile?section=${s.key}`}
            className="group rounded-[var(--radius-sm)] border border-border bg-background/40 p-3 transition-colors hover:border-primary/40"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-display text-xs font-bold uppercase tracking-widest">
                {s.label}
              </span>
              <span
                className={`text-xs font-bold ${
                  s.pct >= 80
                    ? 'text-success'
                    : s.pct >= 50
                    ? 'text-accent'
                    : 'text-muted-foreground'
                }`}
              >
                {s.pct}%
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-panel-elevated">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, s.pct)}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
