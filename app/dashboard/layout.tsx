import { requireUser } from '@/lib/auth'
import { MarketingNav } from '@/components/landing/marketing-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()

  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </>
  )
}
