import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { requireAdmin } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

/**
 * Admin "View as user" impersonation.
 *
 *   GET ?user_id=…&return=…   → start impersonating that user
 *   GET ?stop=1               → restore the admin's own session
 *
 * The session swap is done with supabase.auth.setSession() so the auth cookie
 * is written in @supabase/ssr's own (possibly chunked) format. Earlier versions
 * hand-crafted the cookie value, which modern @supabase/ssr couldn't parse — so
 * the session silently stayed the admin's. We also clear the existing auth
 * cookie chunks first so no stale value gets reassembled.
 */
const ADMIN_COOKIE = '__ez_admin_session'

function authCookieBase(): string {
  const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\./)?.[1] ?? ''
  return ref ? `sb-${ref}-auth-token` : 'sb-auth-token'
}

const secure = process.env.NODE_ENV === 'production'

/** Clear the Supabase auth cookie + any chunked variants on the response. */
function clearAuthCookies(res: NextResponse, names: string[]) {
  const base = authCookieBase()
  for (const name of names) {
    if (name === base || name.startsWith(`${base}.`)) {
      res.cookies.set(name, '', { path: '/', maxAge: 0 })
    }
  }
}

/** An SSR client whose cookie writes land on the redirect response. */
function ssrForResponse(res: NextResponse, currentCookies: { name: string; value: string }[]) {
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => currentCookies,
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) =>
        toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  })
}

export async function GET(req: Request) {
  const adminUser = await requireAdmin()
  const url = new URL(req.url)
  const stop = url.searchParams.get('stop')
  const service = createServiceClient()
  if (!service) return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })

  const jar = await cookies()
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin

  // ── Stop impersonating — restore the admin's saved session ──────────────
  if (stop === '1') {
    const res = NextResponse.redirect(`${siteUrl}/dashboard/admin/users`, { status: 302 })
    const stored = jar.get(ADMIN_COOKIE)?.value
    clearAuthCookies(res, jar.getAll().map((c) => c.name))
    res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
    if (stored) {
      try {
        const t = JSON.parse(stored) as { access_token?: string; refresh_token?: string }
        if (t.access_token && t.refresh_token) {
          await ssrForResponse(res, []).auth.setSession({
            access_token: t.access_token,
            refresh_token: t.refresh_token,
          })
        }
      } catch {
        // ignore — admin can sign in again
      }
    }
    await service.from('audit_log').insert({
      user_id: adminUser.id,
      action: 'impersonate.stop',
      resource_type: 'user',
      resource_id: adminUser.id,
    })
    return res
  }

  // ── Start impersonating ─────────────────────────────────────────────────
  const targetUserId = url.searchParams.get('user_id')
  const returnTo = url.searchParams.get('return') ?? '/dashboard'
  if (!targetUserId) return NextResponse.json({ error: 'user_id is required' }, { status: 400 })

  const { data: target } = await service.auth.admin.getUserById(targetUserId)
  const targetEmail = target?.user?.email
  if (!targetEmail) {
    return NextResponse.json({ error: 'No email on file for that user' }, { status: 400 })
  }

  // Save the admin's current tokens (read from the live session — reliable even
  // when the cookie is chunked) so ?stop=1 can restore them.
  const adminClient = await createClient()
  const {
    data: { session: adminSession },
  } = await adminClient.auth.getSession()

  // Mint a session for the target via a magic-link exchange.
  const { data: link, error: linkErr } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail,
    options: { redirectTo: `${siteUrl}/dashboard` },
  })
  if (linkErr || !link?.properties?.action_link) {
    return NextResponse.json(
      { error: linkErr?.message ?? 'Could not generate impersonation link' },
      { status: 500 }
    )
  }
  const verifyRes = await fetch(link.properties.action_link, { redirect: 'manual' })
  const location = verifyRes.headers.get('location') ?? verifyRes.headers.get('Location') ?? ''
  const hash = location.split('#')[1]
  if (!hash) {
    return NextResponse.json(
      { error: `Verify endpoint did not return tokens (status ${verifyRes.status})` },
      { status: 500 }
    )
  }
  const hp = new URLSearchParams(hash)
  const accessToken = hp.get('access_token')
  const refreshToken = hp.get('refresh_token')
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'No access/refresh token in verify response' }, { status: 500 })
  }

  const res = NextResponse.redirect(`${siteUrl}${returnTo}`, { status: 302 })
  // Stash admin tokens for restore.
  if (adminSession?.access_token && adminSession?.refresh_token) {
    res.cookies.set(
      ADMIN_COOKIE,
      JSON.stringify({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      }),
      { path: '/', httpOnly: true, sameSite: 'lax', secure, maxAge: 60 * 30 }
    )
  }
  // Clear any stale admin auth-cookie chunks, then write the target session in
  // @supabase/ssr's own format.
  clearAuthCookies(res, jar.getAll().map((c) => c.name))
  await ssrForResponse(res, []).auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  await service.from('audit_log').insert({
    user_id: adminUser.id,
    action: 'impersonate.start',
    resource_type: 'user',
    resource_id: targetUserId,
    metadata: { return_to: returnTo },
  })
  return res
}
