import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveAppTheme } from '@/lib/app-theme'

export const dynamic = 'force-dynamic'

/** Per-app PWA manifest so the live app is installable ("Add to Home Screen"). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const col = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? 'id' : 'slug'
  // On {slug}.appsfortalent.com the app is served at the clean root, so the PWA
  // launches at '/'; at /a/{id} (dashboard preview) it's scoped to that path.
  const onSubdomain = (req.headers.get('host') ?? '').toLowerCase().endsWith('.appsfortalent.com')
  const base = onSubdomain ? '/' : `/a/${id}`
  const supabase = createServiceClient()
  let name = 'App'
  let icon: string | null = null
  let bg = '#000000'
  if (supabase) {
    const { data } = await supabase
      .from('talent_apps')
      .select('name, icon_url, primary_color, secondary_color, theme_mode, settings')
      .eq(col, id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) {
      name = data.name
      icon = data.icon_url
      const theme = resolveAppTheme(
        (data.settings as Record<string, unknown>)?.theme,
        data.primary_color,
        data.secondary_color,
        data.theme_mode as 'dark' | 'light'
      )
      bg = theme.bg_color
    }
  }

  const manifest = {
    name,
    short_name: name.slice(0, 12),
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'portrait',
    background_color: bg,
    theme_color: bg,
    icons: icon
      ? [
          { src: icon, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: icon, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ]
      : [],
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=60' },
  })
}
