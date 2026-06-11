import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Edge Zone wordmark.
 *
 * - If a logo image is present in public/ (full lockup with icon +
 *   "THE EDGE ZONE" + tagline all in one), render only that image.
 * - Otherwise fall back to a styled text mark.
 */
function findLogoFile() {
  const pub = join(process.cwd(), 'public')
  const candidates = [
    'edgezone-logo.svg',
    'edgezone-logo.png',
    'edgezone-logo.webp',
    'TheEdgeZoneLogo-1.png',
    'TheEdgeZoneLogo.png',
    'TheEdgeZoneLogo.svg',
  ]
  return candidates.find((f) => existsSync(join(pub, f))) ?? null
}

// Dimensions of the master logo lockup (used for aspect ratio).
const LOGO_W = 2062
const LOGO_H = 684

const SIZES = {
  sm: { textMark: 28, textTitle: 'text-sm', textTagline: 'text-[8px]', imgH: 36 },
  md: { textMark: 40, textTitle: 'text-base', textTagline: 'text-[9px]', imgH: 52 },
  lg: { textMark: 52, textTitle: 'text-xl', textTagline: 'text-[10px]', imgH: 72 },
} as const

export function Wordmark({ size = 'md' as keyof typeof SIZES }) {
  const s = SIZES[size]
  const logoFile = findLogoFile()

  if (logoFile) {
    const w = Math.round((s.imgH * LOGO_W) / LOGO_H)
    return (
      <Link href="/" className="block">
        <Image
          src={`/${logoFile}`}
          alt="The Edge Zone — Elevate Your Game"
          width={LOGO_W}
          height={LOGO_H}
          priority={size === 'md' || size === 'lg'}
          style={{ height: s.imgH, width: w, display: 'block' }}
        />
      </Link>
    )
  }

  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="text-display flex shrink-0 items-center justify-center font-black text-primary"
        style={{ width: s.textMark, height: s.textMark, fontSize: s.textMark * 0.95, lineHeight: 1 }}
      >
        T
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`text-display font-black uppercase tracking-tight text-foreground ${s.textTitle}`}
        >
          THE EDGE ZONE
        </span>
        <span
          className={`mt-0.5 text-display font-medium tracking-[0.05em] text-foreground/80 ${s.textTagline}`}
        >
          Elevate Your Game
        </span>
      </span>
    </Link>
  )
}
