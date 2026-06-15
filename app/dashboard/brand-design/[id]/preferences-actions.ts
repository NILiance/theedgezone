'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { generateConcepts } from '@/app/dashboard/brand-design/actions'

export type PrefsState = { ok?: boolean; error?: string; generated?: number }

const HEX = /^#[0-9a-fA-F]{6}$/

function pickHex(v: FormDataEntryValue | null, fallback: string): string {
  const s = (v ?? '').toString().trim()
  return HEX.test(s) ? s : fallback
}

function pickStr(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

function pickBool(form: FormData, name: string): boolean {
  // Unchecked checkboxes don't appear in FormData, so absence === false.
  return form.has(name)
}

/**
 * Persists the talent's Brand Preferences. Always writes to BOTH the
 * brand_designs row (which the prompt builder reads) AND the profiles
 * row (the source of truth across the app). The form is the single
 * editing surface — no separate profile editor needed for these fields.
 */
export async function saveBrandPreferencesAction(
  _prev: PrefsState,
  form: FormData
): Promise<PrefsState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, user_id, primary_color, secondary_color')
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) return { error: 'Not your brand design' }

  const brandUpdates = {
    brand_name: pickStr(form.get('brand_name')),
    sport: pickStr(form.get('sport')),
    athletic_position: pickStr(form.get('athletic_position')),
    school: pickStr(form.get('school')),
    jersey_number: pickStr(form.get('jersey_number')),
    style_seed: pickStr(form.get('vibe')),
    primary_color: pickHex(form.get('primary_color'), brand.primary_color),
    secondary_color: pickHex(form.get('secondary_color'), brand.secondary_color),
  }

  const { error: brandErr } = await supabase
    .from('brand_designs')
    .update(brandUpdates)
    .eq('id', brandId)
  if (brandErr) return { error: brandErr.message }

  const profileUpdates = {
    display_name: brandUpdates.brand_name,
    sport: brandUpdates.sport,
    athletic_position: brandUpdates.athletic_position,
    school: brandUpdates.school,
    jersey_number: brandUpdates.jersey_number,
    brand_primary_color: brandUpdates.primary_color,
    brand_secondary_color: brandUpdates.secondary_color,
    brand_initials: pickStr(form.get('initials')),
    brand_vibe: pickStr(form.get('vibe')),
    brand_bg_pref: pickStr(form.get('bg_pref')) ?? 'variety',
    brand_include_name: pickBool(form, 'include_name'),
    brand_include_initials: pickBool(form, 'include_initials'),
    brand_include_jersey: pickBool(form, 'include_jersey'),
    brand_elements: pickStr(form.get('elements')),
  }
  await supabase.from('profiles').update(profileUpdates).eq('id', user.id)

  // Optional: kick off concept generation immediately after save. The
  // "Save & Generate" button on the prefs form sets `generate_count`
  // (and optionally `generate_round`) so the talent doesn't have to
  // click two buttons in sequence — and so brand-new preferences are
  // guaranteed to be the ones the generator reads.
  const rawCount = String(form.get('generate_count') ?? '').trim()
  if (rawCount) {
    const count = Math.max(1, Math.min(20, Number(rawCount) || 10))
    const round = Math.max(1, Math.min(3, Number(form.get('generate_round') ?? '1') || 1))
    const genForm = new FormData()
    genForm.set('brand_id', brandId)
    genForm.set('round', String(round))
    genForm.set('count', String(count))
    try {
      await generateConcepts(genForm)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      return { error: `Saved preferences, but generation failed: ${msg}` }
    }
    revalidatePath(`/dashboard/brand-design/${brandId}`)
    return { ok: true, generated: count }
  }

  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true }
}
