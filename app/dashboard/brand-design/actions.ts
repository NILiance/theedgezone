'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import {
  defaultR1Prompt,
  generateConcepts as genIdeogram,
  remixConcept,
  r2RefinePrompt,
  r3FinalizePrompt,
} from '@/lib/ideogram'
import { provisionBrandDesign } from '@/lib/provisioning'
import { assembleBrandKit } from '@/lib/brand-kit'
import { uploadZipToDrive, gdriveConfigured } from '@/lib/gdrive'

/**
 * Create a new brand design row + redirect to the studio.
 * Prefills brand_name / sport / colors from the user's profile.
 */
export async function createBrandDesign() {
  const user = await requireUser()
  const supabase = await createClient()
  const result = await provisionBrandDesign(supabase, user.id)
  if (!result.entity_id) throw new Error('Failed to create brand design')
  redirect(`/dashboard/brand-design/${result.entity_id}`)
}

const generateSchema = z.object({
  brand_id: z.string().uuid(),
  round: z.coerce.number().int().min(1).max(3),
  count: z.coerce.number().int().min(1).max(20).default(20),
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
    .select('id, brand_name, sport, athletic_position, primary_color, secondary_color, style_seed, user_id')
    .eq('id', parsed.data.brand_id)
    .single()

  if (!brand || brand.user_id !== user.id) {
    throw new Error('Brand design not found or not yours')
  }

  const prompt = defaultR1Prompt({
    name: brand.brand_name ?? 'NIL Talent',
    sport: brand.sport,
    style: brand.style_seed,
  })

  const concepts = await genIdeogram({
    prompt,
    count: parsed.data.count,
    aspect_ratio: '1x1',
    palette: [brand.primary_color, brand.secondary_color].filter(Boolean) as string[],
  })

  if (concepts.length === 0) {
    throw new Error('Ideogram returned no concepts — check IDEOGRAM_API_KEY')
  }

  const rows = concepts.map((c) => ({
    brand_design_id: parsed.data.brand_id,
    round: parsed.data.round,
    prompt: c.prompt,
    provider: 'ideogram',
    image_url: c.url,
    thumbnail_url: c.thumbnail_url ?? null,
    metadata: c.metadata ?? null,
  }))

  const { error: insertError } = await supabase.from('logo_concepts').insert(rows)
  if (insertError) throw new Error(insertError.message)

  revalidatePath(`/dashboard/brand-design/${parsed.data.brand_id}`)
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
 * Uses Ideogram V3 Remix with a round-appropriate prompt.
 */
export async function refineRound(brandId: string) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, brand_name, sport, primary_color, secondary_color, user_id')
    .eq('id', brandId)
    .single()
  if (!brand || brand.user_id !== user.id) {
    throw new Error('Brand design not found or not yours')
  }

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

  const prompt =
    nextRound === 2
      ? r2RefinePrompt({ name: brand.brand_name ?? 'NIL Talent', sport: brand.sport })
      : r3FinalizePrompt({ name: brand.brand_name ?? 'NIL Talent' })
  const palette = [brand.primary_color, brand.secondary_color].filter(Boolean) as string[]

  // Cap total Ideogram calls so a generous shortlist doesn't melt the API quota.
  const maxSources = nextRound === 2 ? 6 : 8
  const trimmedSources = sources.slice(0, maxSources)

  const remixed = await Promise.all(
    trimmedSources.map((src) =>
      remixConcept({
        source_url: src.image_url,
        prompt,
        count: variationsPer,
        aspect_ratio: '1x1',
        strength: nextRound === 2 ? 0.55 : 0.35,
        palette,
      })
    )
  )

  const flat = remixed.flat()
  if (flat.length === 0) {
    throw new Error('Ideogram returned no remixed concepts — check IDEOGRAM_API_KEY.')
  }

  const rows = flat.map((c) => ({
    brand_design_id: brandId,
    round: nextRound,
    prompt: c.prompt,
    provider: 'ideogram',
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
  await supabase
    .from('brand_designs')
    .update({
      status: 'selected',
      final_logo_url: concept.image_url,
      finalized_at: new Date().toISOString(),
    })
    .eq('id', concept.brand_design_id)

  revalidatePath(`/dashboard/brand-design/${concept.brand_design_id}`)
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
