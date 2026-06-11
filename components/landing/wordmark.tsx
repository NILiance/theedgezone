import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Edge Zone wordmark. If a logo file has been dropped at public/edgezone-logo.svg
 * (or .png), we render that. Otherwise we fall back to a styled text mark that
 * mirrors the legacy lockup: heavy gold "T" + "THE EDGE ZONE" + "Elevate Your Game"
 * tagline.
 */
function hasLogoFile() {
  const pub = join(process.cwd(), 'public')
  return ['edgezone-logo.svg', 'edgezone-logo.png', 'edgezone-logo.webp'].find((f) =>
    existsSync(join(pub, f))
  )
}

const SIZES = {
  sm: { mark: 28, title: 'text-sm', tagline: 'text-[8px]', gap: 'gap-2' },
  md: { mark: 40, title: 'text-base', tagline: 'text-[9px]', gap: 'gap-2.5' },
  lg: { mark: 52, title: 'text-xl', tagline: 'text-[10px]', gap: 'gap-3' },
} as const

export function Wordmark({ size = 'md' as keyof typeof SIZES }) {
  const s = SIZES[size]
  const logoFile = hasLogoFile()

  return (
    <Link href="/" className={`flex items-center ${s.gap}`}>
      {logoFile ? (
        <Image
          src={`/${logoFile}`}
          alt="The Edge Zone"
          width={s.mark}
          height={s.mark}
          priority
          className="h-auto"
          style={{ width: s.mark }}
        />
      ) : (
        <span
          aria-hidden
          className="text-display flex shrink-0 items-center justify-center font-black text-primary"
          style={{ width: s.mark, height: s.mark, fontSize: s.mark * 0.95, lineHeight: 1 }}
        >
          T
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span
          className={`text-display font-black uppercase tracking-tight text-foreground ${s.title}`}
        >
          THE EDGE ZONE
        </span>
        <span
          className={`mt-0.5 text-display font-medium tracking-[0.05em] text-foreground/80 ${s.tagline}`}
        >
          Elevate Your Game
        </span>
      </span>
    </Link>
  )
}
