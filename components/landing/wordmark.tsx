import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getBrandingSettings } from '@/lib/branding'

/**
 * Edge Zone wordmark.
 *
 * - If a logo image is present in public/, render that at the size configured
 *   in branding_settings (logo_height_nav for nav, logo_height_footer for footer).
 * - Otherwise fall back to a styled text mark using the same height.
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

const LOGO_W = 2062
const LOGO_H = 684

export async function Wordmark({ variant = 'nav' }: { variant?: 'nav' | 'footer' } = {}) {
  const settings = await getBrandingSettings()
  const height = variant === 'nav' ? settings.logo_height_nav : settings.logo_height_footer
  const logoFile = findLogoFile()

  if (logoFile) {
    const w = Math.round((height * LOGO_W) / LOGO_H)
    return (
      <Link href="/" className="block">
        <Image
          src={`/${logoFile}`}
          alt="The Edge Zone — Elevate Your Game"
          width={LOGO_W}
          height={LOGO_H}
          priority={variant === 'nav'}
          style={{ height, width: w, display: 'block' }}
        />
      </Link>
    )
  }

  const titleSize = Math.round(height * 0.36)
  const taglineSize = Math.round(height * 0.18)

  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="text-display flex shrink-0 items-center justify-center font-black text-primary"
        style={{ width: height, height, fontSize: height * 0.95, lineHeight: 1 }}
      >
        T
      </span>
      <span className="flex flex-col leading-none">
        <span
          className="text-display font-black uppercase tracking-tight text-foreground"
          style={{ fontSize: titleSize }}
        >
          THE EDGE ZONE
        </span>
        <span
          className="mt-0.5 text-display font-medium tracking-[0.05em] text-foreground/80"
          style={{ fontSize: taglineSize }}
        >
          {settings.tagline}
        </span>
      </span>
    </Link>
  )
}
