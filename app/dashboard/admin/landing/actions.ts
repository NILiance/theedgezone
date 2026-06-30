'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Save product-landing-page branding: accent color, header logo (uploaded,
 * pulled from the admin's brand design, or a URL), footer text, and a logo
 * toggle. Admin only.
 */
export async function saveLandingSettings(form: FormData): Promise<void> {
  const admin = await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')

  const accent = String(form.get('accent_color') ?? '').trim() || null
  const footer =
    String(form.get('footer_text') ?? '').trim() || 'Brought to you by The Edge Zone'
  const showLogo = form.get('show_logo') === 'on' || form.get('show_logo') === '1'

  // Resolve the logo: uploaded file > "use brand logo" > URL > clear > keep.
  let logoUrl: string | null | undefined = undefined
  const file = form.get('logo_file')
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) throw new Error('Logo too large — max 5MB.')
    const buf = Buffer.from(await file.arrayBuffer())
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `landing/logo-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('brand-assets')
      .upload(path, new Uint8Array(buf), { contentType: file.type || 'image/png', upsert: true })
    if (error) throw new Error(`Logo upload failed: ${error.message}`)
    logoUrl = supabase.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
  } else if (form.get('use_brand_logo') === 'on' || form.get('use_brand_logo') === '1') {
    const { data: brand } = await supabase
      .from('brand_designs')
      .select('final_logo_url, admin_final_logo_url')
      .eq('user_id', admin.id)
      .not('final_logo_url', 'is', null)
      .order('finalized_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    logoUrl =
      (brand as { admin_final_logo_url?: string | null; final_logo_url?: string | null } | null)
        ?.admin_final_logo_url ??
      (brand as { final_logo_url?: string | null } | null)?.final_logo_url ??
      null
  } else {
    const urlText = String(form.get('logo_url') ?? '').trim()
    if (urlText) logoUrl = urlText
    else if (form.get('clear_logo') === '1') logoUrl = null
  }

  const row: Record<string, unknown> = {
    id: 1,
    accent_color: accent,
    footer_text: footer,
    show_logo: showLogo,
    updated_at: new Date().toISOString(),
  }
  if (logoUrl !== undefined) row.logo_url = logoUrl

  const { error } = await supabase.from('landing_settings').upsert(row, { onConflict: 'id' })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/landing')
}
