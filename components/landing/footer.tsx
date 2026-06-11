import Link from 'next/link'
import { Wordmark } from '@/components/landing/wordmark'

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Services', href: '/#services' },
      { label: 'Opportunities', href: '/#opportunities' },
      { label: 'Free Roadmap', href: '/#roadmap' },
      { label: 'Free Resources', href: '/#resources' },
    ],
  },
  {
    title: 'For Talent',
    links: [
      { label: 'Personal Website', href: '/#talent' },
      { label: 'Brand Design', href: '/#talent' },
      { label: 'Electronic Press Kit', href: '/#talent' },
      { label: 'Merch & Fan Support', href: '/#talent' },
    ],
  },
  {
    title: 'For Brands',
    links: [
      { label: 'Find Talent', href: '/#brands' },
      { label: 'Campaigns', href: '/#brands' },
      { label: 'Partnerships', href: '/#brands' },
      { label: 'Brand Ecosystem', href: '/#brands' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About NILiance', href: '/#about' },
      { label: 'Contact', href: '/#contact' },
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/95">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Wordmark size="sm" />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The all-in-one platform where talent build their brand, grow their
              audience, and turn their name, image, and likeness into real income.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-eyebrow mb-4 text-primary">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} The Edge Zone &mdash; A NILiance company. All
            rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Elevate Your Game.
          </p>
        </div>
      </div>
    </footer>
  )
}
