'use client'

import Link from 'next/link'

export type ArsenalSubtab =
  | 'create'
  | 'logo_animation'
  | 'trading_card'
  | 'brand_voice'
  | 'qr_code'
  | 'email_signature'
  | 'social_avatars'
  | 'brand_toolkit'

export const ARSENAL_SUBTABS: Array<{ id: ArsenalSubtab; label: string }> = [
  { id: 'create', label: 'Create' },
  { id: 'logo_animation', label: 'Logo Animation' },
  { id: 'trading_card', label: 'Trading Card' },
  { id: 'brand_voice', label: 'Brand Voice' },
  { id: 'qr_code', label: 'QR Code' },
  { id: 'email_signature', label: 'Email Signature' },
  { id: 'social_avatars', label: 'Social Avatars' },
  { id: 'brand_toolkit', label: 'Brand Toolkit' },
]

export function ArsenalSubtabs({
  brandId,
  active,
}: {
  brandId: string
  active: ArsenalSubtab
}) {
  return (
    <nav className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
      <ul className="flex min-w-max items-stretch">
        {ARSENAL_SUBTABS.map((t) => {
          const isActive = t.id === active
          return (
            <li key={t.id} className="flex-1">
              <Link
                href={`/dashboard/brand-design/${brandId}?view=arsenal&arsenalsubtab=${t.id}`}
                scroll={false}
                className={`text-display flex h-12 items-center justify-center px-4 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'border-2 border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
