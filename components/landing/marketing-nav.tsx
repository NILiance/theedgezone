import Link from 'next/link'
import { Wordmark } from '@/components/landing/wordmark'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AccountMenu } from '@/components/landing/account-menu'

export async function MarketingNav() {
  const user = await getCurrentUser()

  let isAdmin = false
  let displayName: string | null = null
  let userType: string | null = null
  if (user) {
    const supabase = await createClient()
    const [{ data: roleRow }, { data: profile }] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle(),
      supabase.from('profiles').select('display_name, user_type').eq('id', user.id).maybeSingle(),
    ])
    isAdmin = !!roleRow
    displayName = (profile?.display_name as string | null) ?? null
    userType = (profile?.user_type as string | null) ?? null
  }

  // Role-split nav: talent (+ guests/admins) see Opportunities; brands (+ admins)
  // see the Talent Directory — mirrors the legacy header.
  const links: Array<{ label: string; href: string }> = [
    { label: 'HOME', href: '/' },
    { label: 'SERVICES', href: '/services' },
  ]
  if (userType !== 'brand' || isAdmin) links.push({ label: 'OPPORTUNITIES', href: '/opportunities' })
  if (userType === 'brand' || isAdmin)
    links.push({ label: 'TALENT DIRECTORY', href: '/dashboard/talent-directory' })
  links.push(
    { label: 'ABOUT NILIANCE', href: '/about' },
    { label: 'FREE ROADMAP', href: '/roadmap' },
    { label: 'FREE RESOURCES', href: '/resources' }
  )

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Wordmark variant="nav" />
        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
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
              {/* Admin link lives inside the account dropdown (AccountMenu) —
                  no separate nav button needed. */}
              <AccountMenu
                displayName={displayName ?? user.email ?? 'Account'}
                isAdmin={isAdmin}
              />
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
