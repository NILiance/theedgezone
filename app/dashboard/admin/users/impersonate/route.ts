import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Admin "View as user" impersonation.
 *
 * - GET /dashboard/admin/users/impersonate?user_id=...&return=/dashboard/...
 *     starts an impersonation session for the given user, stamps an audit
 *     row, and redirects to ?return (default /dashboard).
 * - GET /dashboard/admin/users/impersonate?stop=1
 *     ends the impersonation by clearing the cookies and rolling back to
 *     the admin's own session.
 *
 * Implementation: we generate a Supabase magic link for the target user
 * (admin can do this via the auth.admin API), open it as a server-side
 * exchange, and set the resulting cookies. The admin's own access /
 * refresh tokens are saved in __ez_admin_session so a follow-up ?stop=1
 * restores them.
 */

const ADMIN_COOKIE = '__ez_admin_session'

export async function GET(req: Request) {
  const adminUser = await requireAdmin()
  const url = new URL(req.url)
  const stop = url.searchParams.get('stop')
  const supabase = createServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })

  const jar = await cookies()

  if (stop === '1') {
    const stored = jar.get(ADMIN_COOKIE)?.value
    if (!stored) {
      // Nothing to restore — just bounce to admin area.
      redirect('/dashboard/admin/users')
    }
    let parsed: { access_token?: string; refresh_token?: string } | null = null
    try {
      parsed = JSON.parse(stored) as { access_token?: string; refresh_token?: string }
    } catch {
      // ignore
    }
    if (parsed?.access_token && parsed?.refresh_token) {
      // Restore the admin session cookie.
      // Supabase SSR stores tokens under `sb-<project-ref>-auth-token` —
      // for portability we set both names a project might use.
      const refUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
      const ref = refUrl.match(/https:\/\/(\w+)\.supabase\.co/)?.[1] ?? ''
      const cookieName = ref ? `sb-${ref}-auth-token` : 'sb-auth-token'
      const value = JSON.stringify([parsed.access_token, parsed.refresh_token, null, null, null])
      jar.set(cookieName, value, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }
    jar.delete(ADMIN_COOKIE)
    await supabase.from('audit_log').insert({
      user_id: adminUser.id,
      action: 'impersonate.stop',
      resource_type: 'user',
      resource_id: adminUser.id,
    })
    redirect('/dashboard/admin/users')
  }

  const targetUserId = url.searchParams.get('user_id')
  const returnTo = url.searchParams.get('return') ?? '/dashboard'
  if (!targetUserId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  const { data: target } = await supabase.auth.admin.getUserById(targetUserId)
  const targetEmail = target?.user?.email
  if (!targetEmail) {
    return NextResponse.json({ error: 'No email on file for that user' }, { status: 400 })
  }

  // Generate a magic-link token we can exchange for a session for the target.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail,
    options: { redirectTo: `${siteUrl}/dashboard` },
  })
  if (linkErr || !link?.properties?.hashed_token) {
    return NextResponse.json(
      { error: linkErr?.message ?? 'Could not generate impersonation link' },
      { status: 500 }
    )
  }

  // Save the admin's current cookies so we can restore them on ?stop=1.
  const refUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const ref = refUrl.match(/https:\/\/(\w+)\.supabase\.co/)?.[1] ?? ''
  const sessionCookieName = ref ? `sb-${ref}-auth-token` : 'sb-auth-token'
  const adminCookie = jar.get(sessionCookieName)?.value
  if (adminCookie) {
    let tokens: { access_token?: string; refresh_token?: string } = {}
    try {
      const arr = JSON.parse(adminCookie) as unknown
      if (Array.isArray(arr) && typeof arr[0] === 'string' && typeof arr[1] === 'string') {
        tokens = { access_token: arr[0], refresh_token: arr[1] }
      }
    } catch {
      // tolerate alternative shapes
    }
    if (tokens.access_token && tokens.refresh_token) {
      jar.set(ADMIN_COOKIE, JSON.stringify(tokens), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 30,
      })
    }
  }

  // Audit before sending the admin to the verify endpoint.
  await supabase.from('audit_log').insert({
    user_id: adminUser.id,
    action: 'impersonate.start',
    resource_type: 'user',
    resource_id: targetUserId,
    metadata: { return_to: returnTo },
  })

  // Verify the magic link as the target user — that sets the session
  // cookies for the target.
  const verifyUrl = new URL(
    `${refUrl.replace(/\/+$/, '')}/auth/v1/verify`
  )
  verifyUrl.searchParams.set('token', link.properties.hashed_token)
  verifyUrl.searchParams.set('type', 'magiclink')
  verifyUrl.searchParams.set('redirect_to', `${siteUrl}${returnTo}`)

  return NextResponse.redirect(verifyUrl.toString(), { status: 302 })
}
