import { NextResponse } from 'next/server'
import { SITE_LOCK_COOKIE, sitePassword, siteLockEnabled, siteLockToken } from '@/lib/site-lock'

export const dynamic = 'force-dynamic'

/**
 * Verifies the pre-launch site password. On success, sets the unlock cookie
 * (SHA-256 token, never the plaintext password) for 30 days and returns the
 * visitor to the site; on failure, back to the lock screen with an error.
 */
export async function POST(request: Request) {
  const form = await request.formData()
  const password = String(form.get('password') ?? '')

  if (!siteLockEnabled() || password !== sitePassword()) {
    return NextResponse.redirect(new URL('/site-locked?error=1', request.url), 303)
  }

  const res = NextResponse.redirect(new URL('/', request.url), 303)
  res.cookies.set(SITE_LOCK_COOKIE, await siteLockToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
