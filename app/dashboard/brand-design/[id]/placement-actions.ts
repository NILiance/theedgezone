'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { composePlacement } from '@/lib/logo-placement'
import { PLACEMENT_DIMS } from './placement-dims'

export type PlacementState = { ok?: boolean; error?: string; url?: string }

function hexToRgb(hex: string, fallback: { r: number; g: number; b: number }) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return fallback
  const n = parseInt(m[1]!, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Composite the talent's logo onto a phone-wallpaper / virtual-background /
 * story-highlight canvas at a chosen position + size, over a solid colour or a
 * generated effect background. Pure sharp work (plus one optional image call
 * for the effect) — gives the talent precise placement the prompt path can't.
 */
export async function generatePlacementAction(
  _prev: PlacementState,
  form: FormData
): Promise<PlacementState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  const kind = String(form.get('kind') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const dims = PLACEMENT_DIMS[kind]
  if (!dims) return { error: 'Unknown placement asset' }

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, user_id, final_logo_url, primary_color, secondary_color, asset_credits_used, asset_credits_total'
    )
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) return { error: 'Not your brand design' }
  if (!brand.final_logo_url) return { error: 'Pick a final logo first.' }
  const used = brand.asset_credits_used ?? 0
  const total = brand.asset_credits_total ?? 10
  if (used >= total) {
    return { error: 'No asset credits left — buy more from the Arsenal credit meter.' }
  }

  const x = Number(form.get('x') ?? 0.5)
  const y = Number(form.get('y') ?? 0.5)
  const scale = Number(form.get('scale') ?? 0.4)
  const bgHex = String(form.get('bg_color') ?? '#0b1e3f')
  const effect = String(form.get('effect') ?? 'none')
  const effectColor = String(form.get('effect_color') ?? '') || undefined
  const logoStyle =
    String(form.get('logo_style') ?? 'transparent') === 'regular' ? 'regular' : 'transparent'

  try {
    const { default: sharp } = await import('sharp')

    // Logo buffer — transparent by default so the background shows around it.
    let logoUrl = brand.final_logo_url
    if (logoStyle === 'transparent') {
      const { ensureTransparentLogo } = await import('@/lib/brand-addons')
      logoUrl = (await ensureTransparentLogo(brandId)) ?? brand.final_logo_url
    }
    const logoRes = await fetch(logoUrl)
    if (!logoRes.ok) return { error: 'Could not fetch your final logo.' }
    const logoBuf = Buffer.from(await logoRes.arrayBuffer())

    // Background: a generated effect or a solid colour.
    let bgImage: Buffer | null = null
    if (effect && effect !== 'none') {
      try {
        const { generateArsenalImage } = await import('@/lib/gemini-image')
        const { effectBackgroundPrompt } = await import('@/lib/arsenal-prompts')
        const colors =
          [effectColor || brand.primary_color, bgHex || brand.secondary_color]
            .filter(Boolean)
            .join(', ') || 'bold brand colors'
        const fx = await generateArsenalImage({
          brandId,
          prompt: effectBackgroundPrompt(effect, colors),
          category: `${kind}_effect`,
        })
        bgImage = Buffer.from(await (await fetch(fx.url)).arrayBuffer())
      } catch {
        /* fall back to the solid colour */
      }
    }

    const composed = await composePlacement(
      {
        canvasW: dims.w,
        canvasH: dims.h,
        bgColor: hexToRgb(bgHex, { r: 11, g: 30, b: 63 }),
        bgImage,
        logo: logoBuf,
        x,
        y,
        scale,
      },
      sharp
    )

    const service = createServiceClient()
    if (!service) return { error: 'Storage service role missing.' }
    const path = `${brandId}/arsenal/${kind}/${Date.now()}.png`
    const { error: upErr } = await service.storage
      .from('brand-assets')
      .upload(path, new Uint8Array(composed), { contentType: 'image/png', upsert: true })
    if (upErr) return { error: `Upload failed: ${upErr.message}` }
    const url = service.storage.from('brand-assets').getPublicUrl(path).data.publicUrl

    const { error: addErr } = await service.from('brand_design_addons').insert({
      brand_design_id: brandId,
      kind,
      url,
      metadata: { x, y, scale, bgColor: bgHex, effect, logoStyle },
    })
    if (addErr) {
      return { error: `Saved image but couldn't record it in Your Creations: ${addErr.message}` }
    }
    await service
      .from('brand_designs')
      .update({ asset_credits_used: used + 1 })
      .eq('id', brandId)

    revalidatePath(`/dashboard/brand-design/${brandId}`)
    return { ok: true, url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Placement render failed' }
  }
}
