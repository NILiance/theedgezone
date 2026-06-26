import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth'

const ADMIN_COOKIE = '__ez_admin_session'

/**
 * Banner rendered on every authed page when the admin is currently
 * impersonating another user. Shows up until they hit "Stop".
 */
export async function ImpersonationBanner() {
  const jar = await cookies()
  const has = jar.get(ADMIN_COOKIE)?.value
  if (!has) return null
  const user = await getCurrentUser()
  return (
    <div className="rounded-[var(--radius)] border border-accent/40 bg-accent/10 px-4 py-2 text-center text-xs">
      <span className="text-display font-bold uppercase tracking-widest text-accent">
        Viewing as {user?.email ?? 'user'}
      </span>{' '}
      <span className="text-foreground">
        You&apos;re browsing as this account. Your admin session is saved.
      </span>{' '}
      <a
        href="/dashboard/admin/users/impersonate?stop=1"
        className="text-display ml-2 inline-block rounded-[var(--radius-sm)] border border-accent bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent"
      >
        Stop impersonating
      </a>
    </div>
  )
}
