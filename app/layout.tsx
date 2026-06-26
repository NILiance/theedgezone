import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import { getBrandingSettings } from '@/lib/branding'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-display',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const { favicon_url } = await getBrandingSettings()
  return {
    title: {
      default: 'Edge Zone',
      template: '%s · Edge Zone',
    },
    description: 'Athlete brand-building, fulfillment, and creator tools.',
    ...(favicon_url ? { icons: { icon: favicon_url, shortcut: favicon_url, apple: favicon_url } } : {}),
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${montserrat.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
