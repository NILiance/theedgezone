'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type LogoOnPhotoState = { ok?: boolean; error?: string; url?: string }

/**
 * Composite the talent's final logo onto an uploaded photo at the
 * requested placement + size. Pure sharp work — no Gemini call. Matches
 * the legacy WP nil_bd_portal_generate flow for category=logo_on_photo
 * (BrandDesign.php:3522).
 */
export async function generateLogoOnPhotoAction(
  _prev: LogoOnPhotoState,
  form: FormData
): Promise<LogoOnPhotoState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  const placement = String(form.get('placement') ?? 'bottom_right')
  const size = String(form.get('size') ?? 'medium')
  const photo = form.get('photo')
  if (!brandId) return { error: 'Missing brand id' }
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: 'Pick a photo to stamp the logo onto.' }
  }
  if (photo.size > 20 * 1024 * 1024) {
    return { error: 'Photo too large — max 20MB.' }
  }

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, user_id, final_logo_url, asset_credits_used, asset_credits_total, brand_name'
    )
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) return { error: 'Not your brand design' }
  if (!brand.final_logo_url) {
    return { error: 'Pick a final logo first — this composites it on top of your photo.' }
  }
  const used = brand.asset_credits_used ?? 0
  const total = brand.asset_credits_total ?? 10
  if (used >= total) {
    return { error: 'No asset credits left — buy more from the Arsenal credit meter.' }
  }

  // Lazy-load sharp so this module is safely importable from server-component
  // pages (which would otherwise trigger the native binding init at render).
  const { default: sharp } = await import('sharp')

  // Fetch the photo + logo as buffers.
  const photoBuf = Buffer.from(await photo.arrayBuffer())
  const logoRes = await fetch(brand.final_logo_url)
  if (!logoRes.ok) return { error: 'Could not fetch your final logo.' }
  const logoBuf = Buffer.from(await logoRes.arrayBuffer())

  // Normalize the photo to RGB + grab dimensions.
  const photoMeta = await sharp(photoBuf).metadata()
  const pw = photoMeta.width ?? 1200
  const ph = photoMeta.height ?? 800

  // Logo size as a percentage of the photo's smaller side.
  const sizePct = size === 'small' ? 0.1 : size === 'large' ? 0.35 : 0.2
  const logoTargetW = Math.max(64, Math.round(Math.min(pw, ph) * sizePct))
  const logoMeta = await sharp(logoBuf).metadata()
  const logoAspect = (logoMeta.width ?? 1) / (logoMeta.height ?? 1)
  const logoTargetH = Math.round(logoTargetW / Math.max(0.1, logoAspect))

  // Resize the logo (preserve alpha) and apply watermark opacity if needed.
  let prepared = await sharp(logoBuf)
    .resize(logoTargetW, logoTargetH, { fit: 'inside' })
    .ensureAlpha()
    .png()
    .toBuffer()
  if (placement === 'watermark') {
    // Drop the logo's alpha to ~35% so it sits subtly over the photo.
    prepared = await sharp(prepared)
      .ensureAlpha(0.35)
      .toBuffer()
  }

  // Resolve the position in pixels.
  const pad = Math.round(Math.min(pw, ph) * 0.03)
  const pos: Record<string, { top: number; left: number }> = {
    top_left: { top: pad, left: pad },
    top_center: { top: pad, left: Math.round((pw - logoTargetW) / 2) },
    top_right: { top: pad, left: pw - logoTargetW - pad },
    center_left: { top: Math.round((ph - logoTargetH) / 2), left: pad },
    center: {
      top: Math.round((ph - logoTargetH) / 2),
      left: Math.round((pw - logoTargetW) / 2),
    },
    center_right: {
      top: Math.round((ph - logoTargetH) / 2),
      left: pw - logoTargetW - pad,
    },
    bottom_left: { top: ph - logoTargetH - pad, left: pad },
    bottom_center: {
      top: ph - logoTargetH - pad,
      left: Math.round((pw - logoTargetW) / 2),
    },
    bottom_right: { top: ph - logoTargetH - pad, left: pw - logoTargetW - pad },
    watermark: {
      top: Math.round((ph - logoTargetH) / 2),
      left: Math.round((pw - logoTargetW) / 2),
    },
  }
  const placementCfg = pos[placement] ?? pos.bottom_right!

  // Composite + export as PNG (preserves transparency in the photo if any).
  const composed = await sharp(photoBuf)
    .composite([{ input: prepared, top: placementCfg.top, left: placementCfg.left }])
    .png()
    .toBuffer()

  // Upload to brand-assets/{brandId}/arsenal/logo_on_photo/...
  const service = createServiceClient()
  if (!service) return { error: 'Storage service role missing.' }
  const ts = Date.now()
  const path = `${brandId}/arsenal/logo_on_photo/${ts}-${placement}-${size}.png`
  const { error: uploadErr } = await service.storage
    .from('brand-assets')
    .upload(path, new Uint8Array(composed), {
      contentType: 'image/png',
      upsert: true,
    })
  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` }
  const { data: pub } = service.storage.from('brand-assets').getPublicUrl(path)
  const url = pub.publicUrl

  // Persist + bump credits.
  const { error: addonErr } = await service.from('brand_design_addons').insert({
    brand_design_id: brandId,
    kind: 'logo_on_photo',
    url,
    metadata: { placement, size, source_filename: photo.name },
  })
  if (addonErr) {
    return {
      error: `Saved image but couldn't record it in Your Creations: ${addonErr.message}`,
    }
  }
  await service
    .from('brand_designs')
    .update({ asset_credits_used: used + 1 })
    .eq('id', brandId)

  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true, url }
}
