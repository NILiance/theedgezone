import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface BrandingSettings {
  logo_height_nav: number
  logo_height_footer: number
  tagline: string
  favicon_url: string | null
}

const DEFAULTS: BrandingSettings = {
  logo_height_nav: 52,
  logo_height_footer: 36,
  tagline: 'Elevate Your Game',
  favicon_url: null,
}

/**
 * Returns the singleton branding settings row. Cached per-request via React's
 * cache() so all Server Components within one request share the same result.
 * Falls back to defaults if the row is missing or the query fails (e.g.
 * during local dev before the migration is applied).
 */
export const getBrandingSettings = cache(async (): Promise<BrandingSettings> => {
  try {
    const supabase = await createClient()
    // Try with favicon_url; if the column isn't there yet (migration not
    // applied), fall back to the original columns so the rest still works.
    const withFavicon = await supabase
      .from('branding_settings')
      .select('logo_height_nav, logo_height_footer, tagline, favicon_url')
      .eq('id', 1)
      .maybeSingle()
    if (!withFavicon.error) {
      return { ...DEFAULTS, ...(withFavicon.data ?? {}) }
    }
    const base = await supabase
      .from('branding_settings')
      .select('logo_height_nav, logo_height_footer, tagline')
      .eq('id', 1)
      .maybeSingle()
    return { ...DEFAULTS, ...(base.data ?? {}) }
  } catch {
    return DEFAULTS
  }
})
