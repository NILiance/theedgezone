import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'
import { env } from '@/lib/env'

/**
 * Host suffixes we own. A request to `<slug>.<suffix>` is rewritten
 * to `/<target>/<slug>` so a single Next.js app serves all subdomains.
 */
const SUBDOMAIN_SUFFIXES: Array<{ suffix: string; target: string }> = [
  { suffix: '.mytalentsite.com', target: 'site' },
  { suffix: '.talentepk.com', target: 'epk' },
  { suffix: '.podcastfortalent.com', target: 'podcast' },
]

/**
 * Hosts that should NEVER trigger a custom-domain lookup
 * (our own apex domains + local dev).
 */
const PRIMARY_HOSTS = new Set([
  'theedgezone.com',
  'www.theedgezone.com',
  'mytalentsite.com',
  'www.mytalentsite.com',
  'talentepk.com',
  'www.talentepk.com',
  'podcastfortalent.com',
  'www.podcastfortalent.com',
  'localhost:3000',
  '127.0.0.1:3000',
])

const RESERVED_SUBDOMAINS = new Set(['www', 'mail', 'cpanel', 'webmail', 'whm', 'ftp', 'ns1', 'ns2'])

export async function middleware(request: NextRequest) {
  const rawHost = (request.headers.get('host') ?? '').toLowerCase()
  const host = rawHost.split(':')[0] // strip port for matching
  const url = request.nextUrl.clone()

  // 1. Subdomain routing — known suffixes
  for (const { suffix, target } of SUBDOMAIN_SUFFIXES) {
    if (host.endsWith(suffix) && rawHost !== suffix.slice(1)) {
      const slug = host.slice(0, -suffix.length).replace(/[^a-z0-9-]/g, '')
      if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
        url.pathname = `/${target}/${slug}${url.pathname === '/' ? '' : url.pathname}`
        return NextResponse.rewrite(url)
      }
    }
  }

  // 2. Custom domain — single indexed lookup in Supabase
  if (!PRIMARY_HOSTS.has(rawHost) && !SUBDOMAIN_SUFFIXES.some((s) => rawHost.endsWith(s.suffix))) {
    const mapping = await lookupCustomDomain(request, rawHost)
    if (mapping) {
      url.pathname = `/${mapping.target_type}/${mapping.target_slug}${url.pathname === '/' ? '' : url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // 3. Supabase session refresh (passes through unchanged response otherwise)
  return updateSession(request)
}

async function lookupCustomDomain(request: NextRequest, host: string) {
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data } = await supabase
    .from('custom_domains')
    .select('target_type, target_slug')
    .eq('domain', host)
    .not('verified_at', 'is', null)
    .maybeSingle()

  return data
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
