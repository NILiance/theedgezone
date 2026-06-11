import Link from 'next/link'

/**
 * Edge Zone wordmark — text-only stand-in until the user drops in the real
 * SVG/PNG to public/edgezone-logo.svg. Matches the legacy header lockup:
 * a stylized "T" mark on a dark plate, with "THE EDGE ZONE" beside it and
 * "Elevate Your Game" tagline underneath in gold small caps.
 */
export function Wordmark({ size = 'md' as 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { mark: 32, title: 'text-base', tagline: 'text-[8px]' },
    md: { mark: 44, title: 'text-xl', tagline: 'text-[9px]' },
    lg: { mark: 56, title: 'text-2xl', tagline: 'text-[10px]' },
  } as const
  const s = sizes[size]

  return (
    <Link href="/" className="flex items-center gap-3">
      <span
        aria-hidden
        className="text-display relative flex items-center justify-center rounded-md border border-primary/40 bg-background font-black text-primary"
        style={{ width: s.mark, height: s.mark }}
      >
        <span style={{ fontSize: s.mark * 0.6, lineHeight: 1 }}>T</span>
      </span>
      <span className="flex flex-col">
        <span className={`text-display font-black uppercase tracking-tight text-foreground ${s.title}`}>
          THE EDGE ZONE
        </span>
        <span className={`text-display font-medium uppercase tracking-[0.2em] text-primary ${s.tagline}`}>
          Elevate Your Game
        </span>
      </span>
    </Link>
  )
}
