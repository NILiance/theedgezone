'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export type AppDefaultsState = { ok?: boolean; error?: string }

function parseAd(form: FormData, prefix: string): Record<string, unknown> | null {
  const enabled = form.get(`${prefix}_enabled`) === 'on'
  if (!enabled) return null
  return {
    enabled: true,
    image_url: String(form.get(`${prefix}_image`) ?? '').trim() || null,
    click_url: String(form.get(`${prefix}_click`) ?? '').trim() || null,
    label: String(form.get(`${prefix}_label`) ?? '').trim() || null,
    frequency: Number(form.get(`${prefix}_freq`) ?? 0) || null,
  }
}

export async function saveAppDefaults(_prev: AppDefaultsState, form: FormData): Promise<AppDefaultsState> {
  const user = await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }

  const linksRaw = String(form.get('default_links') ?? '[]')
  let defaultLinks: unknown
  try {
    defaultLinks = JSON.parse(linksRaw)
    if (!Array.isArray(defaultLinks)) throw new Error('not array')
  } catch {
    return { error: 'Default links must be valid JSON array' }
  }

  const payload = {
    default_links: defaultLinks,
    splash_ad: parseAd(form, 'splash'),
    footer_ad: parseAd(form, 'footer'),
    in_feed_ad: parseAd(form, 'infeed'),
    interstitial_ad: parseAd(form, 'interstitial'),
    auto_enroll_edgezone_merch: form.get('auto_enroll_edgezone_merch') === 'on',
    show_platform_merch: form.get('show_platform_merch') === 'on',
    revenue_share_talent: Math.max(0, Math.min(1, Number(form.get('revenue_share_talent') ?? 0.85))),
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }

  const { error } = await supabase.from('app_defaults').update(payload).eq('id', 'default')
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/app-defaults')
  return { ok: true }
}
