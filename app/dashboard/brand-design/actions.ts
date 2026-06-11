'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { defaultR1Prompt, generateConcepts as genIdeogram } from '@/lib/ideogram'

/**
 * Create a new brand design row + redirect to the studio.
 * Prefills brand_name / sport / colors from the user's profile.
 */
export async function createBrandDesign() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, sport, athletic_position, school, brand_primary_color, brand_secondary_color, jersey_number')
    .eq('id', user.id)
    .maybeSingle()

  const { data: created, error } = await supabase
    .from('brand_designs')
    .insert({
      user_id: user.id,
      brand_name: profile?.display_name ?? null,
      sport: profile?.sport ?? null,
      athletic_position: profile?.athletic_position ?? null,
      school: profile?.school ?? null,
      jersey_number: profile?.jersey_number ?? null,
      primary_color: profile?.brand_primary_color ?? '#C8A84E',
      secondary_color: profile?.brand_secondary_color ?? '#000000',
      status: 'concept',
    })
    .select('id')
    .single()

  if (error || !created) throw new Error(error?.message ?? 'Failed to create brand design')

  redirect(`/dashboard/brand-design/${created.id}`)
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

export async function advanceRound(brandId: string) {
  const user = await requireUser()
  const supabase = await createClient()

  // Get max round so far + shortlist count
  const { data: counts } = await supabase
    .from('logo_concepts')
    .select('round', { count: 'exact' })
    .eq('brand_design_id', brandId)

  const maxRound = (counts ?? []).reduce((acc, c) => Math.max(acc, c.round), 1)
  const nextRound = Math.min(3, maxRound + 1)

  await supabase
    .from('brand_designs')
    .update({
      status: nextRound === 3 ? 'finalizing' : 'refining',
    })
    .eq('id', brandId)
    .eq('user_id', user.id)

  revalidatePath(`/dashboard/brand-design/${brandId}`)
}
