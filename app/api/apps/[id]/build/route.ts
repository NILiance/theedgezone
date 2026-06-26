import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { buildExpoZip } from '@/lib/expo-build'

/**
 * GET /api/apps/{id}/build
 * Streams an Expo project ZIP for the talent's app.
 */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select(
      'id, user_id, name, slug, tagline, description, package_id, icon_url, splash_url, primary_color, secondary_color, theme_mode, screens, settings'
    )
    .eq('id', id)
    .single()
  if (!app || app.user_id !== user.id) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 })
  }

  const settings = (app.settings ?? {}) as {
    contact_email?: string
    push_enabled?: boolean
    supports_in_app_purchases?: boolean
  }
  const pushEnabled = settings.push_enabled ?? false
  const iapEnabled = settings.supports_in_app_purchases ?? false

  const iapProducts: Array<{
    product_id: string
    display_name: string
    price_usd: number
    kind: string
    apple_product_id: string | null
    google_product_id: string | null
  }> = []
  if (iapEnabled) {
    const { data: rows } = await supabase
      .from('app_iap_products')
      .select('product_id, display_name, price_usd, kind, apple_product_id, google_product_id')
      .eq('app_id', app.id)
      .in('status', ['active', 'pending_review'])
    for (const r of rows ?? []) iapProducts.push(r)
  }

  const { zipBuffer, filename } = await buildExpoZip({
    name: app.name,
    slug: app.slug,
    tagline: app.tagline,
    description: app.description,
    package_id: app.package_id ?? `com.edgezone.${app.slug.replace(/-/g, '')}`,
    icon_url: app.icon_url,
    splash_url: app.splash_url,
    primary_color: app.primary_color,
    secondary_color: app.secondary_color,
    theme_mode: (app.theme_mode as 'dark' | 'light') ?? 'dark',
    contact_email: settings.contact_email,
    privacy_policy_url: null,
    app_id: app.id,
    edgezone_api_url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.com',
    push_enabled: pushEnabled,
    iap_enabled: iapEnabled,
    iap_products: iapProducts,
    screens: Array.isArray(app.screens)
      ? (app.screens as Array<{
          id: string
          title: string
          icon?: string
          type: string
          content?: Record<string, unknown>
        }>)
      : [],
  })

  // Stamp last_build_at
  await supabase
    .from('talent_apps')
    .update({ last_build_at: new Date().toISOString() })
    .eq('id', app.id)

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
