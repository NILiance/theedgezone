'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export type AdminBrandState = { ok?: boolean; error?: string; message?: string; url?: string }

const ALLOWED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const ALLOWED_DOC_MIME = new Set(['application/pdf'])
const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

async function uploadFile(
  file: File,
  brandId: string,
  bucket: 'site-assets',
  prefix: string,
  acceptMime: Set<string>
): Promise<{ url: string; path: string }> {
  if (file.size === 0) throw new Error('File is empty')
  if (file.size > MAX_BYTES) throw new Error(`File too large — max ${MAX_BYTES / 1024 / 1024} MB`)
  if (!acceptMime.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const uid = crypto.randomUUID()
  const path = `admin/brands/${brandId}/${prefix}-${uid}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage.from(bucket).upload(path, new Uint8Array(arrayBuffer), {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(error.message)
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: pub.publicUrl, path }
}

export async function adminUploadConcept(
  _prev: AdminBrandState,
  form: FormData
): Promise<AdminBrandState> {
  const user = await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const file = form.get('file')
  if (!(file instanceof File)) return { error: 'No file uploaded' }
  try {
    const { url } = await uploadFile(file, brandId, 'site-assets', 'concept', ALLOWED_IMAGE_MIME)
    const supabase = createServiceClient()
    if (!supabase) return { error: 'Service role key missing' }
    const { data: brand } = await supabase
      .from('brand_designs')
      .select('admin_concepts')
      .eq('id', brandId)
      .single()
    const concepts = ((brand?.admin_concepts as Array<{ url: string; uploaded_at: string }>) ?? [])
    concepts.unshift({ url, uploaded_at: new Date().toISOString() })
    await supabase
      .from('brand_designs')
      .update({
        admin_concepts: concepts,
        admin_updated_at: new Date().toISOString(),
        admin_updated_by: user.id,
      })
      .eq('id', brandId)
    revalidatePath(`/dashboard/admin/brands/${brandId}`)
    return { ok: true, url, message: 'Concept uploaded.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

export async function adminUploadFinalLogo(
  _prev: AdminBrandState,
  form: FormData
): Promise<AdminBrandState> {
  const user = await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const file = form.get('file')
  if (!(file instanceof File)) return { error: 'No file uploaded' }
  try {
    const { url } = await uploadFile(file, brandId, 'site-assets', 'final-logo', ALLOWED_IMAGE_MIME)
    const supabase = createServiceClient()
    if (!supabase) return { error: 'Service role key missing' }
    await supabase
      .from('brand_designs')
      .update({
        admin_final_logo_url: url,
        final_logo_url: url, // also stamp the canonical field so kit / addons use it
        status: 'selected',
        finalized_at: new Date().toISOString(),
        admin_updated_at: new Date().toISOString(),
        admin_updated_by: user.id,
      })
      .eq('id', brandId)
    revalidatePath(`/dashboard/admin/brands/${brandId}`)
    return { ok: true, url, message: 'Final logo uploaded and stamped on brand.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

export async function adminUploadBrandGuide(
  _prev: AdminBrandState,
  form: FormData
): Promise<AdminBrandState> {
  const user = await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const file = form.get('file')
  if (!(file instanceof File)) return { error: 'No file uploaded' }
  try {
    const { url } = await uploadFile(file, brandId, 'site-assets', 'brand-guide', ALLOWED_DOC_MIME)
    const supabase = createServiceClient()
    if (!supabase) return { error: 'Service role key missing' }
    await supabase
      .from('brand_designs')
      .update({
        admin_brand_guide_url: url,
        admin_updated_at: new Date().toISOString(),
        admin_updated_by: user.id,
      })
      .eq('id', brandId)
    revalidatePath(`/dashboard/admin/brands/${brandId}`)
    return { ok: true, url, message: 'Brand guide uploaded.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

export async function adminResetSelections(
  _prev: AdminBrandState,
  form: FormData
): Promise<AdminBrandState> {
  const user = await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  await supabase
    .from('logo_concepts')
    .update({ is_shortlisted: false, is_selected: false })
    .eq('brand_design_id', brandId)
  await supabase
    .from('brand_designs')
    .update({
      status: 'concept',
      final_logo_url: null,
      finalized_at: null,
      admin_updated_at: new Date().toISOString(),
      admin_updated_by: user.id,
    })
    .eq('id', brandId)
  revalidatePath(`/dashboard/admin/brands/${brandId}`)
  return { ok: true, message: 'Cleared shortlists + final selection. Talent restarts.' }
}

export async function adminRegenerateKit(
  _prev: AdminBrandState,
  form: FormData
): Promise<AdminBrandState> {
  await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, user_id, brand_name, sport, athletic_position, school, jersey_number, primary_color, secondary_color, accent_color, neutral_color, final_logo_url'
    )
    .eq('id', brandId)
    .single()
  if (!brand?.final_logo_url) return { error: 'Pick a final logo first (talent or admin upload)' }
  try {
    const { assembleBrandKit } = await import('@/lib/brand-kit')
    const { data: profile } = await supabase
      .from('profiles')
      .select('brand_tagline, brand_font_pair')
      .eq('id', brand.user_id)
      .maybeSingle()
    const kit = await assembleBrandKit({
      brand_name: brand.brand_name ?? 'untitled',
      sport: brand.sport,
      athletic_position: brand.athletic_position,
      school: brand.school,
      jersey_number: brand.jersey_number,
      primary_color: brand.primary_color ?? '#000000',
      secondary_color: brand.secondary_color ?? '#ffffff',
      accent_color: brand.accent_color,
      font_pair: profile?.brand_font_pair ?? null,
      tagline: profile?.brand_tagline ?? null,
      final_logo_url: brand.final_logo_url,
    })
    const path = `${brand.user_id}/brand-kits/${brand.id}/${kit.filename}`
    const { error: upErr } = await supabase.storage
      .from('site-assets')
      .upload(path, new Uint8Array(kit.zipBuffer), { contentType: 'application/zip', upsert: true })
    if (upErr) return { error: upErr.message }
    const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
    await supabase
      .from('brand_designs')
      .update({ brand_kit_url: pub.publicUrl, brand_kit_assembled_at: new Date().toISOString() })
      .eq('id', brandId)
    revalidatePath(`/dashboard/admin/brands/${brandId}`)
    return { ok: true, url: pub.publicUrl, message: 'Kit re-assembled with current colors + assets.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Kit build failed' }
  }
}

export async function adminSendCredentials(
  _prev: AdminBrandState,
  form: FormData
): Promise<AdminBrandState> {
  await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('brand_name, user_id')
    .eq('id', brandId)
    .single()
  if (!brand) return { error: 'Brand not found' }
  const { data: userRes } = await supabase.auth.admin.getUserById(brand.user_id)
  const email = userRes?.user?.email
  if (!email) return { error: 'No email on file for the brand owner' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theedgezone.com'
  const studioUrl = `${siteUrl}/dashboard/brand-design/${brandId}`
  const subject = `Your ${brand.brand_name ?? 'brand'} design is ready`
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0a0e14;color:#fafafa;padding:32px;">
  <div style="max-width:520px;margin:0 auto;background:#111720;border:1px solid #1f2937;border-radius:12px;padding:32px;">
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#3aa7ff;">Brand Design Studio</p>
    <h1 style="margin:0 0 12px;font-size:22px;">Your designs are ready to review.</h1>
    <p style="margin:0 0 18px;color:#cbd5e1;line-height:1.55;">
      The design team has uploaded fresh concepts and notes to your Brand Design Studio.
      Sign in to your Edge Zone account and open the studio to review, shortlist, and pick a final.
    </p>
    <a href="${studioUrl}" style="display:inline-block;background:#3aa7ff;color:#0a0e14;padding:10px 18px;border-radius:8px;font-weight:800;text-decoration:none;">Open Studio →</a>
    <p style="margin:24px 0 0;color:#64748b;font-size:11px;line-height:1.55;">
      Sign in URL: <a href="${siteUrl}/sign-in" style="color:#94a3b8;">${siteUrl}/sign-in</a><br />
      Account email: ${email}<br />
      If you can't sign in, reset your password at ${siteUrl}/forgot-password.
    </p>
  </div></body></html>`
  const r = await sendEmail({
    to: email,
    subject,
    html,
    templateKey: 'brand_credentials',
    metadata: { brand_id: brandId },
  })
  if (!r.success) return { error: r.error ?? 'Send failed' }
  return { ok: true, message: `Email sent to ${email}.` }
}

export async function adminSaveNotes(
  _prev: AdminBrandState,
  form: FormData
): Promise<AdminBrandState> {
  const user = await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const notes = String(form.get('notes') ?? '').trim()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const { error } = await supabase
    .from('brand_designs')
    .update({
      admin_notes: notes || null,
      admin_updated_at: new Date().toISOString(),
      admin_updated_by: user.id,
    })
    .eq('id', brandId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/admin/brands/${brandId}`)
  return { ok: true, message: 'Notes saved.' }
}

export async function adminDeleteBrand(form: FormData) {
  await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return
  const supabase = createServiceClient()
  if (!supabase) return
  // Cascade: remove the matching order(s) so the talent's dashboard
  // doesn't keep showing a "Personal Brand Design · READY" card linking
  // to a now-deleted brand. provisioned_entity_id is a free-form uuid
  // (no FK), so the cleanup has to happen here.
  await supabase.from('orders').delete().eq('provisioned_entity_id', brandId)
  await supabase.from('brand_designs').delete().eq('id', brandId)
  revalidatePath('/dashboard/admin/brands')
  redirect('/dashboard/admin/brands')
}

export type GrantCreditsState = { ok?: boolean; error?: string; newTotal?: number }

/**
 * Admin tool: grant N additional asset credits to a brand design. Bumps
 * `asset_credits_total` so the talent can generate more Arsenal assets
 * without burning their own credit pack. Use cases: comp credits after
 * a generation failure, VIP grants, support refunds.
 */
export async function adminGrantCredits(
  _prev: GrantCreditsState,
  form: FormData
): Promise<GrantCreditsState> {
  await requireAdmin()
  const brandId = String(form.get('brand_id') ?? '')
  const amountRaw = String(form.get('amount') ?? '').trim()
  const amount = Number(amountRaw)
  if (!brandId) return { error: 'Missing brand id' }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
    return { error: 'Pick a credit amount between 1 and 1000.' }
  }

  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }

  const { data: brand, error: readErr } = await supabase
    .from('brand_designs')
    .select('asset_credits_total, asset_credits_used')
    .eq('id', brandId)
    .maybeSingle()
  if (readErr || !brand) return { error: readErr?.message ?? 'Brand not found' }

  const newTotal = (brand.asset_credits_total ?? 10) + Math.round(amount)
  const { error: writeErr } = await supabase
    .from('brand_designs')
    .update({ asset_credits_total: newTotal })
    .eq('id', brandId)
  if (writeErr) return { error: writeErr.message }

  revalidatePath(`/dashboard/admin/brands/${brandId}`)
  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true, newTotal }
}
