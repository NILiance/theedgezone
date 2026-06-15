'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { generateLogoConcepts } from '@/lib/gemini-image'
import { REFINEMENT_SEEDS, type BrandPrefs } from '@/lib/brand-prompts'
import { provisionBrandDesign } from '@/lib/provisioning'
import { assembleBrandKit } from '@/lib/brand-kit'
import { uploadZipToDrive, gdriveConfigured } from '@/lib/gdrive'

/**
 * Create a new brand design row + redirect to the studio.
 * Prefills brand_name / sport / colors from the user's profile.
 */
export async function createBrandDesign(formData?: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const fromProfile = formData ? formData.get('from_profile') !== 'no' : true
  const result = await provisionBrandDesign(supabase, user.id, undefined, { fromProfile })
  if (!result.entity_id) throw new Error('Failed to create brand design')
  redirect(`/dashboard/brand-design/${result.entity_id}`)
}

const generateSchema = z.object({
  brand_id: z.string().uuid(),
  round: z.coerce.number().int().min(1).max(3),
  count: z.coerce.number().int().min(1).max(20).default(10),
})

export async function generateConcepts(formData: FormData) {
  const user = await requireUser()
  const parsed = generateSchema.safeParse({
    brand_id: formData.get('brand_id'),
    round: formData.get('round') ?? '1',
    count: formData.get('count') ?? '20',
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, brand_name, sport, athletic_position, jersey_number, primary_color, secondary_color, style_seed, user_id'
    )
    .eq('id', parsed.data.brand_id)
    .single()

  if (!brand || brand.user_id !== user.id) {
    throw new Error('Brand design not found or not yours')
  }

  // Pull the matching profile fields so the prompt has initials,
  // elements, vibe, background pref, include toggles, and any
  // inspiration the talent set in the Preferences panel.
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, brand_initials, brand_elements, brand_vibe, brand_bg_pref, brand_include_name, brand_include_initials, brand_include_jersey, brand_inspiration_urls'
    )
    .eq('id', user.id)
    .maybeSingle()

  const prefs = buildPrefsFromBrandAndProfile(brand, profile)

  // Cycle concept index from the count of existing concepts so the style
  // mod rotation continues across "+10 more" batches.
  const { count: existingCount } = await supabase
    .from('logo_concepts')
    .select('id', { count: 'exact', head: true })
    .eq('brand_design_id', parsed.data.brand_id)
    .eq('round', parsed.data.round)
  const startIndex = existingCount ?? 0

  const concepts = await generateLogoConcepts({
    brandId: parsed.data.brand_id,
    prefs,
    round: parsed.data.round === 1 ? 1 : 2,
    count: parsed.data.count,
    startIndex,
  })

  if (concepts.length === 0) {
    throw new Error(
      'Our designer is offline right now. Try again in a moment — if this keeps happening, ping support.'
    )
  }

  const rows = concepts.map((c) => ({
    brand_design_id: parsed.data.brand_id,
    round: parsed.data.round,
    prompt: c.prompt,
    provider: 'gemini',
    image_url: c.url,
    thumbnail_url: c.thumbnail_url ?? null,
    metadata: c.metadata ?? null,
  }))

  const { error: insertError } = await supabase.from('logo_concepts').insert(rows)
  if (insertError) throw new Error(insertError.message)

  revalidatePath(`/dashboard/brand-design/${parsed.data.brand_id}`)
}

/**
 * Best-effort: turn the two hex colors stored on the brand into the
 * free-text "colors" string the prompt expects ("navy and gold").
 */
/**
 * Builds the prompt prefs object from a brand_designs row + the talent's
 * profile. Single source of truth so generateConcepts and refineRound
 * stay in sync.
 */
function buildPrefsFromBrandAndProfile(
  brand: {
    brand_name: string | null
    sport: string | null
    athletic_position: string | null
    jersey_number: string | null
    primary_color: string | null
    secondary_color: string | null
    style_seed: string | null
  },
  profile: {
    display_name: string | null
    brand_initials?: string | null
    brand_elements?: string | null
    brand_vibe?: string | null
    brand_bg_pref?: string | null
    brand_include_name?: boolean | null
    brand_include_initials?: boolean | null
    brand_include_jersey?: boolean | null
    brand_inspiration_urls?: unknown
  } | null
): BrandPrefs {
  const colorWords = describeColors(brand.primary_color, brand.secondary_color)
  const inspirationFreeText = Array.isArray(profile?.brand_inspiration_urls)
    ? (profile.brand_inspiration_urls as string[]).slice(0, 3).join(', ')
    : ''
  return {
    name: brand.brand_name ?? profile?.display_name ?? 'NIL Talent',
    sport: brand.sport,
    position: brand.athletic_position,
    jerseyNum: brand.jersey_number,
    initials: profile?.brand_initials ?? null,
    elements: profile?.brand_elements ?? null,
    colors: colorWords,
    vibe: profile?.brand_vibe ?? brand.style_seed ?? null,
    backgroundPref: profile?.brand_bg_pref ?? 'variety',
    includeName: profile?.brand_include_name ?? true,
    includeInitials: profile?.brand_include_initials ?? false,
    includeJersey: profile?.brand_include_jersey ?? false,
    inspiration: inspirationFreeText || null,
  }
}

function describeColors(primary: string | null, secondary: string | null): string {
  const named = [hexToName(primary), hexToName(secondary)].filter(Boolean)
  if (named.length === 2) return `${named[0]} and ${named[1]}`
  if (named.length === 1) return named[0]!
  const raw = [primary, secondary].filter(Boolean)
  if (raw.length === 2) return `${raw[0]} and ${raw[1]}`
  return raw[0] ?? 'blue and black'
}

function hexToName(hex: string | null): string | null {
  if (!hex) return null
  const h = hex.toLowerCase().replace('#', '')
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  // Greys + black/white
  if (r < 30 && g < 30 && b < 30) return 'black'
  if (r > 225 && g > 225 && b > 225) return 'white'
  if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && Math.abs(r - b) < 12) {
    return r < 90 ? 'charcoal' : r < 165 ? 'grey' : 'silver'
  }
  // Hue-based label
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h360 = 0
  if (max === r) h360 = ((g - b) / d) % 6
  else if (max === g) h360 = (b - r) / d + 2
  else h360 = (r - g) / d + 4
  h360 = (h360 * 60 + 360) % 360
  if (h360 < 15 || h360 >= 345) return 'red'
  if (h360 < 35) return 'orange'
  if (h360 < 65) return 'yellow gold'
  if (h360 < 95) return 'lime'
  if (h360 < 155) return 'green'
  if (h360 < 195) return 'teal'
  if (h360 < 235) return 'blue'
  if (h360 < 270) return 'indigo'
  if (h360 < 305) return 'purple'
  return 'magenta'
}

export async function toggleShortlist(conceptId: string) {
  const user = await requireUser()
  const supabase = await createClient()

  // Pull current value (only the owner can see it via RLS)
  const { data: concept } = await supabase
    .from('logo_concepts')
    .select('id, is_shortlisted, brand_design_id')
    .eq('id', conceptId)
    .single()
  if (!concept) throw new Error('Concept not found')

  await supabase
    .from('logo_concepts')
    .update({ is_shortlisted: !concept.is_shortlisted })
    .eq('id', conceptId)

  revalidatePath(`/dashboard/brand-design/${concept.brand_design_id}`)
}

/**
 * Refine the shortlisted concepts of the current max round and write the
 * next round's outputs. R2 generates 3 variations per shortlisted R1; R3
 * generates 2 variations per shortlisted R2 (or all R2 if none picked).
 *
 * Uses Gemini 2.5 Flash Image with the chosen R1 image as the reference,
 * cycling through the legacy refinement seeds ('refined and elevated',
 * 'bolder and more dynamic', etc.) so each variation explores a different
 * direction.
 */
export async function refineRound(brandId: string) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, brand_name, sport, athletic_position, jersey_number, primary_color, secondary_color, style_seed, user_id'
    )
    .eq('id', brandId)
    .single()
  if (!brand || brand.user_id !== user.id) {
    throw new Error('Brand design not found or not yours')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, brand_initials, brand_elements, brand_vibe, brand_bg_pref, brand_include_name, brand_include_initials, brand_include_jersey, brand_inspiration_urls'
    )
    .eq('id', user.id)
    .maybeSingle()

  const { data: concepts } = await supabase
    .from('logo_concepts')
    .select('id, round, image_url, is_shortlisted')
    .eq('brand_design_id', brandId)
    .order('round', { ascending: true })

  const currentMaxRound = (concepts ?? []).reduce((acc, c) => Math.max(acc, c.round), 1)
  if (currentMaxRound >= 3) {
    throw new Error('Already at round 3 — pick a final to finish.')
  }
  const nextRound = currentMaxRound + 1
  const variationsPer = nextRound === 2 ? 3 : 2

  // Source pool: shortlisted from current round, fallback to all if none.
  const fromCurrent = (concepts ?? []).filter((c) => c.round === currentMaxRound)
  let sources = fromCurrent.filter((c) => c.is_shortlisted)
  if (sources.length === 0) sources = fromCurrent.slice(0, 6)
  if (sources.length === 0) {
    throw new Error('Generate Round 1 concepts before refining.')
  }

  // Cap total Gemini calls so a generous shortlist doesn't burn the quota.
  const maxSources = nextRound === 2 ? 6 : 8
  const trimmedSources = sources.slice(0, maxSources)

  const prefs = buildPrefsFromBrandAndProfile(brand, profile)

  // For each source, generate `variationsPer` refined concepts using the
  // source image as our designer's reference. Cycle refinement seeds so
  // each variation tries a different direction.
  const batches = await Promise.all(
    trimmedSources.map((src, srcIdx) => {
      const seedOffset = srcIdx * variationsPer
      const refinementSeeds = Array.from({ length: variationsPer }, (_, i) =>
        REFINEMENT_SEEDS[(seedOffset + i) % REFINEMENT_SEEDS.length]!
      )
      return generateLogoConcepts({
        brandId,
        prefs,
        round: 2,
        count: variationsPer,
        referenceImageUrl: src.image_url,
        refinementSeeds,
        startIndex: seedOffset,
      })
    })
  )

  const flat = batches.flat()
  if (flat.length === 0) {
    throw new Error(
      'Our designer is offline right now. Try again in a moment — if this keeps happening, ping support.'
    )
  }

  const rows = flat.map((c) => ({
    brand_design_id: brandId,
    round: nextRound,
    prompt: c.prompt,
    provider: 'gemini',
    image_url: c.url,
    thumbnail_url: c.thumbnail_url ?? null,
    metadata: c.metadata ?? null,
  }))
  const { error: insertError } = await supabase.from('logo_concepts').insert(rows)
  if (insertError) throw new Error(insertError.message)

  await supabase
    .from('brand_designs')
    .update({ status: nextRound === 3 ? 'finalizing' : 'refining' })
    .eq('id', brandId)

  revalidatePath(`/dashboard/brand-design/${brandId}`)
}

/**
 * Legacy alias kept so existing UI bindings don't break. New code should
 * call refineRound directly.
 */
export async function advanceRound(brandId: string) {
  return refineRound(brandId)
}

const selectFinalSchema = z.object({ concept_id: z.string().uuid() })

/** Mark a single concept as the chosen final for its brand design. */
export async function selectFinalConcept(formData: FormData) {
  const user = await requireUser()
  const parsed = selectFinalSchema.safeParse({ concept_id: formData.get('concept_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { data: concept } = await supabase
    .from('logo_concepts')
    .select('id, brand_design_id, image_url, brand_designs!inner(user_id)')
    .eq('id', parsed.data.concept_id)
    .single()
  const ownerId = (concept as { brand_designs?: { user_id?: string } })?.brand_designs?.user_id
  if (!concept || ownerId !== user.id) throw new Error('Concept not found')

  // Clear any previous final
  await supabase
    .from('logo_concepts')
    .update({ is_selected: false })
    .eq('brand_design_id', concept.brand_design_id)
    .eq('is_selected', true)

  await supabase
    .from('logo_concepts')
    .update({ is_selected: true })
    .eq('id', parsed.data.concept_id)

  // Stamp the brand_design with the chosen URL + final status.
  // Extract dominant colors from the chosen logo so the kit + downstream
  // assets reflect what Ideogram actually rendered, not what the talent
  // typed into their profile months ago. Failure is non-blocking — we
  // keep the existing brand_designs colors if extraction errors. Lazy
  // import keeps sharp out of the module init graph so the page doesn't
  // 500 on Vercel when sharp's native binding is slow to resolve.
  let extracted: {
    primary: string | null
    secondary: string | null
    accent: string | null
    neutral: string | null
  } | null = null
  try {
    const { extractPaletteFromUrl } = await import('@/lib/color-extract')
    extracted = await extractPaletteFromUrl(concept.image_url)
  } catch (err) {
    console.error('[brand-design] color extraction failed', err)
  }

  const update: Record<string, unknown> = {
    status: 'selected',
    final_logo_url: concept.image_url,
    finalized_at: new Date().toISOString(),
  }
  if (extracted?.primary) update.primary_color = extracted.primary
  if (extracted?.secondary) update.secondary_color = extracted.secondary
  if (extracted?.accent) update.accent_color = extracted.accent
  if (extracted?.neutral) update.neutral_color = extracted.neutral

  await supabase.from('brand_designs').update(update).eq('id', concept.brand_design_id)

  // Auto-assemble the brand kit inline so the talent doesn't need a
  // second click. Matches the legacy WP plugin flow. Fire as a normal
  // call (not background) so any failure surfaces in the action result.
  try {
    await assembleKitForBrand(concept.brand_design_id, user.id)
  } catch (err) {
    // Kit failure shouldn't block the final-selection write — the talent
    // can still hit the manual "Assemble brand kit" button.
    console.error('[brand-design] auto-assemble failed', err)
  }

  revalidatePath(`/dashboard/brand-design/${concept.brand_design_id}`)
}

/**
 * Build + upload the brand kit ZIP for a brand_designs row. Pulled out of
 * assembleBrandKit so selectFinalConcept can call it inline.
 */
async function assembleKitForBrand(brandId: string, userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, user_id, brand_name, sport, athletic_position, school, jersey_number, primary_color, secondary_color, accent_color, neutral_color, final_logo_url'
    )
    .eq('id', brandId)
    .single()
  if (!brand || brand.user_id !== userId || !brand.final_logo_url) return null

  // Profile pulls in tagline + font pair if the user filled them in via the
  // enhanced Brand profile section. Logo-extracted colors take precedence
  // over profile colors because they reflect what Ideogram actually drew.
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_tagline, brand_font_pair')
    .eq('id', userId)
    .maybeSingle()

  const kit = await assembleBrandKit({
    brand_name: brand.brand_name ?? 'untitled',
    sport: brand.sport,
    athletic_position: brand.athletic_position,
    school: brand.school,
    jersey_number: brand.jersey_number,
    primary_color: brand.primary_color ?? '#000000',
    secondary_color: brand.secondary_color ?? '#ffffff',
    accent_color: brand.accent_color ?? null,
    font_pair: profile?.brand_font_pair ?? null,
    tagline: profile?.brand_tagline ?? null,
    final_logo_url: brand.final_logo_url,
  })

  let publicUrl: string | null = null
  let driveId: string | null = null
  if (gdriveConfigured()) {
    try {
      const folder = brand.brand_name ?? `brand-${brand.id.slice(0, 6)}`
      const up = await uploadZipToDrive(kit.zipBuffer, kit.filename, folder)
      publicUrl = up.webViewLink
      driveId = up.fileId
    } catch (err) {
      console.error('[brand-kit] Drive upload failed, falling back to Storage', err)
    }
  }

  if (!publicUrl) {
    const path = `${userId}/brand-kits/${brand.id}/${kit.filename}`
    const { error: upErr } = await supabase.storage
      .from('site-assets')
      .upload(path, new Uint8Array(kit.zipBuffer), {
        contentType: 'application/zip',
        upsert: true,
      })
    if (upErr) throw new Error(upErr.message)
    const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
    publicUrl = pub.publicUrl
  }

  await supabase
    .from('brand_designs')
    .update({
      brand_kit_url: publicUrl,
      brand_kit_drive_id: driveId,
      brand_kit_assembled_at: new Date().toISOString(),
    })
    .eq('id', brandId)

  return publicUrl
}

const saveCanvasSchema = z.object({
  brand_id: z.string().uuid(),
  data_url: z.string().regex(/^data:image\/png;base64,/),
  filename: z.string().max(120).optional(),
  layers_meta: z.string().optional(),
})

/** Receives a base64 PNG from the canvas editor, uploads it to Storage, records in brand_assets. */
export async function saveCanvasOutput(
  formData: FormData
): Promise<{ ok: boolean; url?: string; message?: string }> {
  const user = await requireUser()
  const parsed = saveCanvasSchema.safeParse({
    brand_id: formData.get('brand_id'),
    data_url: formData.get('data_url'),
    filename: formData.get('filename') || undefined,
    layers_meta: formData.get('layers_meta') || undefined,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, user_id')
    .eq('id', parsed.data.brand_id)
    .single()
  if (!brand || brand.user_id !== user.id) return { ok: false, message: 'Brand design not found' }

  const buffer = Buffer.from(
    parsed.data.data_url.replace(/^data:image\/png;base64,/, ''),
    'base64'
  )
  const filename =
    parsed.data.filename?.replace(/[^a-z0-9.-]/gi, '-') ?? `logo-overlay-${Date.now()}.png`
  const path = `${user.id}/brand-overlays/${brand.id}/${filename}`

  const { error: upErr } = await supabase.storage
    .from('site-assets')
    .upload(path, buffer, { contentType: 'image/png', upsert: true })
  if (upErr) return { ok: false, message: upErr.message }
  const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
  const url = pub.publicUrl

  let meta: Record<string, unknown> | null = null
  if (parsed.data.layers_meta) {
    try {
      meta = JSON.parse(parsed.data.layers_meta)
    } catch {
      /* swallow */
    }
  }

  await supabase.from('brand_assets').insert({
    brand_design_id: brand.id,
    asset_type: 'logo_overlay',
    url,
    metadata: meta as unknown as Record<string, unknown>,
  })

  revalidatePath(`/dashboard/brand-design/${brand.id}`)
  return { ok: true, url }
}

const assembleKitSchema = z.object({ brand_id: z.string().uuid() })

export async function assembleAndUploadKit(
  formData: FormData
): Promise<{ ok: boolean; url?: string; message?: string }> {
  const user = await requireUser()
  const parsed = assembleKitSchema.safeParse({ brand_id: formData.get('brand_id') })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, user_id, brand_name, sport, athletic_position, school, jersey_number, primary_color, secondary_color, final_logo_url, brand_kit_url, brand_kit_drive_id'
    )
    .eq('id', parsed.data.brand_id)
    .single()
  if (!brand || brand.user_id !== user.id) return { ok: false, message: 'Brand design not found' }
  if (!brand.final_logo_url) {
    return { ok: false, message: 'Pick a final logo first.' }
  }

  // Build the kit ZIP
  let kit: { zipBuffer: Buffer; filename: string }
  try {
    kit = await assembleBrandKit({
      brand_name: brand.brand_name ?? 'untitled',
      sport: brand.sport,
      athletic_position: brand.athletic_position,
      school: brand.school,
      jersey_number: brand.jersey_number,
      primary_color: brand.primary_color ?? '#000000',
      secondary_color: brand.secondary_color ?? '#ffffff',
      final_logo_url: brand.final_logo_url,
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Kit build failed' }
  }

  // Upload — if Drive isn't configured, return the zip via Supabase Storage instead.
  let publicUrl: string | null = null
  let driveId: string | null = null

  if (gdriveConfigured()) {
    try {
      const folder = brand.brand_name ?? `brand-${brand.id.slice(0, 6)}`
      const up = await uploadZipToDrive(kit.zipBuffer, kit.filename, folder)
      publicUrl = up.webViewLink
      driveId = up.fileId
    } catch (err) {
      // Fall through to Supabase Storage if Drive upload fails
      console.error('[brand-kit] Drive upload failed, falling back to Storage', err)
    }
  }

  if (!publicUrl) {
    // Fallback: upload to site-assets bucket so the user can still download
    const path = `${user.id}/brand-kits/${brand.id}/${kit.filename}`
    const { error: upErr } = await supabase.storage
      .from('site-assets')
      .upload(path, kit.zipBuffer, {
        contentType: 'application/zip',
        upsert: true,
      })
    if (upErr) return { ok: false, message: upErr.message }
    const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
    publicUrl = pub.publicUrl
  }

  // Stamp on the brand row
  await supabase
    .from('brand_designs')
    .update({
      brand_kit_url: publicUrl,
      brand_kit_drive_id: driveId,
      brand_kit_assembled_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.brand_id)

  revalidatePath(`/dashboard/brand-design/${parsed.data.brand_id}`)
  return { ok: true, url: publicUrl }
}

const clearShortlistSchema = z.object({ brand_id: z.string().uuid(), round: z.coerce.number().int().min(1).max(3) })
export async function clearShortlistForRound(formData: FormData) {
  const user = await requireUser()
  const parsed = clearShortlistSchema.safeParse({
    brand_id: formData.get('brand_id'),
    round: formData.get('round'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('user_id')
    .eq('id', parsed.data.brand_id)
    .single()
  if (!brand || brand.user_id !== user.id) throw new Error('Brand design not found')

  await supabase
    .from('logo_concepts')
    .update({ is_shortlisted: false })
    .eq('brand_design_id', parsed.data.brand_id)
    .eq('round', parsed.data.round)

  revalidatePath(`/dashboard/brand-design/${parsed.data.brand_id}`)
}
