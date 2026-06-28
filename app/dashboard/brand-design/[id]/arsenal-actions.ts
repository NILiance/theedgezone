'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { generateArsenalImage } from '@/lib/gemini-image'
import { slugify } from '@/lib/provisioning'
import {
  type ArsenalContext,
  businessCardPrompt,
  emailSignaturePrompt,
  virtualBackgroundPrompt,
  phoneWallpaperPrompt,
  storyHighlightPrompt,
  letterheadPrompt,
  presentationPrompt,
  thankYouCardPrompt,
  mediaKitPrompt,
  socialMediaPrompt,
  merchPrompt,
  uniformPrompt,
  iconGeneratorPrompt,
  gameDayPrompt,
} from '@/lib/arsenal-prompts'

export type ArsenalGenState = { ok?: boolean; error?: string; url?: string }

export type ArsenalCategory =
  | 'business_card'
  | 'email_signature_image'
  | 'virtual_background'
  | 'phone_wallpaper'
  | 'story_highlight'
  | 'letterhead'
  | 'presentation'
  | 'thank_you_card'
  | 'media_kit'
  | 'social_media'
  | 'merch_mockup'
  | 'sport_uniform'
  | 'icon_generator'
  | 'game_day'

const VALID: ArsenalCategory[] = [
  'business_card',
  'email_signature_image',
  'virtual_background',
  'phone_wallpaper',
  'story_highlight',
  'letterhead',
  'presentation',
  'thank_you_card',
  'media_kit',
  'social_media',
  'merch_mockup',
  'sport_uniform',
  'icon_generator',
  'game_day',
]

/**
 * Generate a single Brand Arsenal asset for the given brand using the
 * exact legacy prompts. The user's selected final logo is passed to
 * Gemini as the reference image so the result is composed AROUND it
 * (not redrawn from scratch).
 */
export async function generateArsenalAsset(
  _prev: ArsenalGenState,
  form: FormData
): Promise<ArsenalGenState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  const category = String(form.get('category') ?? '') as ArsenalCategory
  const option = String(form.get('option') ?? '')
  const styleOpt = String(form.get('style') ?? 'announcement')
  const notes = String(form.get('notes') ?? '')
  // Optional sport override — used by the Sport Uniforms two-step picker.
  // Falls back to the brand row's sport if not supplied.
  const sportOverride = String(form.get('sport') ?? '')

  if (!brandId) return { error: 'Missing brand id' }
  if (!VALID.includes(category)) return { error: 'Unknown arsenal category' }

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, user_id, brand_name, sport, athletic_position, jersey_number, primary_color, secondary_color, accent_color, neutral_color, final_logo_url, asset_credits_used, asset_credits_total'
    )
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) return { error: 'Not your brand design' }
  if (!brand.final_logo_url) {
    return { error: 'Pick a final logo first — every arsenal asset is built around it.' }
  }
  const used = brand.asset_credits_used ?? 0
  const total = brand.asset_credits_total ?? 10
  if (used >= total) {
    return { error: 'No asset credits left — buy more from the Arsenal credit meter.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, email, phone, website_url, school, brand_mood, brand_audience, social_handles, tagline'
    )
    .eq('id', user.id)
    .maybeSingle()

  const positionLine = [brand.athletic_position, brand.sport].filter(Boolean).join(' · ')
  const colors = describeColors(brand.primary_color, brand.secondary_color)

  const ctx: ArsenalContext = {
    brandName: brand.brand_name ?? profile?.display_name ?? 'Athlete',
    positionLine: positionLine || null,
    tagline: (profile as { tagline?: string | null } | null)?.tagline ?? null,
    colors,
    vibe: (profile as { brand_mood?: string | null } | null)?.brand_mood ?? null,
    tone: null,
    colorMode: 'dark',
    styleWords: 'bold, modern, dynamic',
    sport: sportOverride || brand.sport,
    position: brand.athletic_position,
    email: profile?.email ?? null,
    phone: (profile as { phone?: string | null } | null)?.phone ?? null,
    website: (profile as { website_url?: string | null } | null)?.website_url ?? null,
    school: (profile as { school?: string | null } | null)?.school ?? null,
    socialHandles: (profile as { social_handles?: Record<string, string> | null } | null)
      ?.social_handles ?? null,
    jerseyNumber: brand.jersey_number,
  }

  let built
  try {
    switch (category) {
      case 'business_card':
        built = businessCardPrompt(ctx)
        break
      case 'email_signature_image':
        built = emailSignaturePrompt(ctx)
        break
      case 'virtual_background':
        built = virtualBackgroundPrompt(ctx)
        break
      case 'phone_wallpaper':
        built = phoneWallpaperPrompt(ctx)
        break
      case 'story_highlight':
        built = storyHighlightPrompt(ctx, option || 'Sports')
        break
      case 'letterhead':
        built = letterheadPrompt(ctx)
        break
      case 'presentation':
        built = presentationPrompt(ctx)
        break
      case 'thank_you_card':
        built = thankYouCardPrompt(ctx)
        break
      case 'media_kit':
        built = mediaKitPrompt(ctx)
        break
      case 'social_media':
        built = socialMediaPrompt(ctx, option || 'instagram', styleOpt)
        break
      case 'merch_mockup':
        built = merchPrompt(ctx, option || 'tshirt', ctx.tagline)
        break
      case 'sport_uniform':
        built = uniformPrompt(ctx, option || 'home_jersey', notes || null)
        break
      case 'icon_generator':
        built = iconGeneratorPrompt(ctx, option || 'app_icon')
        break
      case 'game_day':
        built = gameDayPrompt(ctx, option || 'hype')
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not build prompt'
    return { error: msg }
  }

  // Exact print proportions — Gemini only approximates aspect, so cover-crop
  // the result to these true print sizes.
  const PRINT_DIMS: Record<string, { w: number; h: number }> = {
    business_card: { w: 1050, h: 600 }, // 3.5 × 2 in
    letterhead: { w: 1275, h: 1650 }, // 8.5 × 11 in
    media_kit: { w: 1275, h: 1650 }, // 8.5 × 11 in
    thank_you_card: { w: 1500, h: 2100 }, // 5 × 7 in
    presentation: { w: 1920, h: 1080 }, // 16:9 slide
  }

  let result
  try {
    const userName = (brand.brand_name ?? profile?.display_name ?? 'Athlete').trim()
    const brandSlug = slugify(brand.brand_name ?? `brand-${brand.id.slice(0, 8)}`)
    result = await generateArsenalImage({
      brandId,
      prompt: built.prompt,
      category,
      referenceImageUrl: brand.final_logo_url,
      filenameHint: option || category,
      userName,
      brandSlug,
      cropTo: PRINT_DIMS[category],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Our designer failed to generate this asset'
    return { error: msg }
  }

  // Persist + bump credits via the regular auth-bound client so RLS
  // (owner-insert policy) governs writes — no service-role required.
  const { error: insertError } = await supabase.from('brand_design_addons').insert({
    brand_design_id: brandId,
    kind: category,
    url: result.url,
    metadata: {
      provider: 'gemini',
      category,
      option,
      style: styleOpt,
      sport: sportOverride || null,
      prompt: result.prompt,
    },
  })
  if (insertError) {
    return {
      error: `Saved image but couldn't record it in Your Creations: ${insertError.message}`,
    }
  }
  await supabase
    .from('brand_designs')
    .update({ asset_credits_used: used + 1 })
    .eq('id', brandId)

  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true, url: result.url }
}

function describeColors(primary: string | null, secondary: string | null): string {
  const raw = [primary, secondary].filter(Boolean)
  if (raw.length === 0) return 'navy and gold'
  return raw.join(' and ')
}
