import Link from 'next/link'
import { ARSENAL_GROUP_META, type ArsenalGroup } from './arsenal-subtab-meta'

/**
 * A group tab's landing: the group's items rendered as a card grid (like the
 * Create tab). Each card links to that item's generator sub-tab.
 */
export function ArsenalGroupLanding({
  brandId,
  group,
}: {
  brandId: string
  group: ArsenalGroup
}) {
  const meta = ARSENAL_GROUP_META[group]
  return (
    <div>
      <p className="text-eyebrow text-primary">{meta.label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{meta.intro}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {meta.cards.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/brand-design/${brandId}?view=arsenal&arsenalsubtab=${c.id}`}
            scroll={false}
            className="group rounded-[var(--radius)] border border-border bg-panel/40 p-5 text-center transition-colors hover:border-primary/50 hover:bg-panel/60"
          >
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-md text-2xl"
              style={{ background: `${c.color}22`, color: c.color }}
              aria-hidden
            >
              {c.icon}
            </span>
            <p className="text-display mt-3 text-base font-black" style={{ color: c.color }}>
              {c.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{c.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
