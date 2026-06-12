import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Branded short-link redirector. /go/{slug}
 * Resolves through public.site_short_links and increments the click count.
 *
 * Matches the site by host header so two sites can use the same slug
 * without colliding.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const host = request.headers.get('host')?.toLowerCase() ?? ''
  const supabase = await createClient()

  // Resolve which site this /go/ belongs to.
  let siteId: string | null = null

  // 1. Subdomain match (slug.mytalentsite.com, etc.)
  const apexSlug = (() => {
    const lower = host.split(':')[0]
    for (const suffix of ['.mytalentsite.com', '.talentepk.com', '.podcastfortalent.com']) {
      if (lower.endsWith(suffix)) return lower.slice(0, -suffix.length)
    }
    return null
  })()
  if (apexSlug) {
    const { data } = await supabase
      .from('sites')
      .select('id')
      .eq('slug', apexSlug)
      .maybeSingle()
    siteId = data?.id ?? null
  }

  // 2. Custom domain match
  if (!siteId) {
    const { data } = await supabase
      .from('sites')
      .select('id')
      .eq('custom_domain', host.split(':')[0])
      .maybeSingle()
    siteId = data?.id ?? null
  }

  // 3. Explicit ?s=slug fallback (for sharing from other domains)
  if (!siteId) {
    const fallback = request.nextUrl.searchParams.get('s')
    if (fallback) {
      const { data } = await supabase.from('sites').select('id').eq('slug', fallback).maybeSingle()
      siteId = data?.id ?? null
    }
  }

  if (!siteId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { data: link } = await supabase
    .from('site_short_links')
    .select('id, target_url, clicks')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .maybeSingle()

  if (!link?.target_url) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Fire-and-forget click increment.
  await supabase
    .from('site_short_links')
    .update({
      clicks: (link.clicks ?? 0) + 1,
      last_clicked_at: new Date().toISOString(),
    })
    .eq('id', link.id)

  return NextResponse.redirect(link.target_url)
}
