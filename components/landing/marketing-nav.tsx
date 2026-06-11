import Link from 'next/link'
import { Wordmark } from '@/components/landing/wordmark'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const NAV_LINKS = [
  { label: 'HOME', href: '/' },
  { label: 'SERVICES', href: '/services' },
  { label: 'OPPORTUNITIES', href: '/opportunities' },
  { label: 'ABOUT NILIANCE', href: '/about' },
  { label: 'FREE ROADMAP', href: '/roadmap' },
  { label: 'FREE RESOURCES', href: '/resources' },
]

export async function MarketingNav() {
  const user = await getCurrentUser()

  let isAdmin = false
  if (user) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    isAdmin = !!data
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Wordmark variant="nav" />
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-display text-[13px] font-bold uppercase tracking-[0.12em] text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/dashboard/admin/branding" className="hidden sm:block">
                  <Button size="sm" variant="ghost">
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button size="sm">My Account</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hidden sm:block">
                <Button size="sm" variant="ghost">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
