'use server'

import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { buildToolkitPrompt, type ToolkitContext } from '@/lib/brand-toolkit-prompts'

export type ToolkitGenState = {
  ok?: boolean
  error?: string
  content?: string
  sectionId?: string
}

const MODEL = 'claude-sonnet-4-6'

/**
 * Generate (or regenerate) one toolkit section for the talent's brand.
 * Persists the markdown to brand_toolkit_entries so we don't re-charge
 * Claude on every page render.
 */
export async function generateToolkitAction(
  _prev: ToolkitGenState,
  form: FormData
): Promise<ToolkitGenState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  const sectionId = String(form.get('section_id') ?? '')
  const regenerate = form.get('regenerate') === '1'
  if (!brandId || !sectionId) return { error: 'Missing brand id or section id.' }

  if (!env.ANTHROPIC_API_KEY) {
    return {
      error: 'The coaching engine is not configured yet. Admins can set it up under Integrations.',
    }
  }

  const supabase = await createClient()

  // Verify ownership.
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, user_id, brand_name, sport, athletic_position, school, jersey_number')
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) return { error: 'Not your brand design.' }

  // If we already have a cached entry and the talent didn't ask to
  // regenerate, return it as-is.
  if (!regenerate) {
    const { data: existing } = await supabase
      .from('brand_toolkit_entries')
      .select('content_md')
      .eq('brand_design_id', brandId)
      .eq('section_id', sectionId)
      .maybeSingle()
    if (existing?.content_md) {
      return { ok: true, content: existing.content_md, sectionId }
    }
  }

  // Pull the talent's profile context.
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, brand_tagline, brand_vibe, brand_audience, socials, selected_goals'
    )
    .eq('id', user.id)
    .maybeSingle()

  const ctx: ToolkitContext = {
    name: brand.brand_name ?? profile?.display_name ?? 'Athlete',
    sport: brand.sport,
    position: brand.athletic_position,
    school: brand.school,
    jerseyNumber: brand.jersey_number,
    tagline: (profile as { brand_tagline?: string | null } | null)?.brand_tagline ?? null,
    goals: Array.isArray((profile as { selected_goals?: string[] } | null)?.selected_goals)
      ? ((profile as { selected_goals?: string[] } | null)?.selected_goals ?? []).join(', ') ||
        null
      : null,
    vibe: (profile as { brand_vibe?: string | null } | null)?.brand_vibe ?? null,
    audience: (profile as { brand_audience?: string | null } | null)?.brand_audience ?? null,
    socialHandles: (profile as { socials?: Record<string, string> | null } | null)?.socials ?? null,
  }

  const prompt = buildToolkitPrompt(sectionId, ctx)

  let contentMd = ''
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })
    const textPart = response.content.find((p) => p.type === 'text')
    contentMd = textPart && textPart.type === 'text' ? textPart.text : ''
    if (!contentMd) return { error: 'Coaching engine returned no content. Try again.' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Coaching engine failed.'
    return { error: message }
  }

  // Upsert the entry — keyed by (brand, section).
  const { error: upsertErr } = await supabase
    .from('brand_toolkit_entries')
    .upsert(
      {
        brand_design_id: brandId,
        user_id: user.id,
        section_id: sectionId,
        content_md: contentMd,
        model_used: MODEL,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'brand_design_id,section_id' }
    )
  if (upsertErr) return { error: upsertErr.message }

  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true, content: contentMd, sectionId }
}
