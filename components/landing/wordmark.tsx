import Link from 'next/link'
import Image from 'next/image'
import { getBrandingSettings } from '@/lib/branding'

/**
 * Edge Zone wordmark — the logo shown in the nav and footer of every page.
 *
 * The logo is a committed asset in public/ and is referenced by URL so the
 * CDN serves it identically on every route. We deliberately do NOT probe the
 * filesystem (existsSync) to find it: on Vercel's serverless runtime the
 * public/ folder isn't on the function's filesystem, so that check returned
 * false on dynamically-rendered pages (the dashboard) and the logo fell back
 * to a plain "T" — while statically-prerendered marketing pages kept it. That
 * mismatch is exactly what made the logo "disappear on certain pages."
 *
 * Height comes from branding_settings (logo_height_nav / logo_height_footer).
 * To swap the logo, replace public/TheEdgeZoneLogo-1.png (same intrinsic
 * aspect ratio) or update LOGO_SRC + the dimensions below.
 */
const LOGO_SRC = '/TheEdgeZoneLogo-1.png'
const LOGO_W = 2062
const LOGO_H = 684

export async function Wordmark({ variant = 'nav' }: { variant?: 'nav' | 'footer' } = {}) {
  const settings = await getBrandingSettings()
  const height = variant === 'nav' ? settings.logo_height_nav : settings.logo_height_footer
  const width = Math.round((height * LOGO_W) / LOGO_H)

  return (
    <Link href="/" className="block">
      <Image
        src={LOGO_SRC}
        alt="The Edge Zone — Elevate Your Game"
        width={LOGO_W}
        height={LOGO_H}
        priority={variant === 'nav'}
        style={{ height, width, display: 'block' }}
      />
    </Link>
  )
}
