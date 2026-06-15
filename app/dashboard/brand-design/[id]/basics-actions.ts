'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type BasicsState = { ok?: boolean; error?: string }

const HEX = /^#[0-9a-fA-F]{6}$/

function pickHex(v: FormDataEntryValue | null, fallback: string): string {
  const s = (v ?? '').toString().trim()
  return HEX.test(s) ? s : fallback
}

function pickStr(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

export async function saveBrandBasicsAction(
  _prev: BasicsState,
  form: FormData
): Promise<BasicsState> {
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
    style_seed: pickStr(form.get('style_seed')),
    primary_color: pickHex(form.get('primary_color'), brand.primary_color),
    secondary_color: pickHex(form.get('secondary_color'), brand.secondary_color),
  }

  const { error: brandErr } = await supabase
    .from('brand_designs')
    .update(brandUpdates)
    .eq('id', brandId)
  if (brandErr) return { error: brandErr.message }

  // Profile sync — shared fields write back so the rest of the app sees a
  // single source of truth. Skipped if the form explicitly opts out.
  if (form.get('sync_to_profile') !== '0') {
    await supabase
      .from('profiles')
      .update({
        display_name: brandUpdates.brand_name,
        sport: brandUpdates.sport,
        athletic_position: brandUpdates.athletic_position,
        school: brandUpdates.school,
        jersey_number: brandUpdates.jersey_number,
        brand_primary_color: brandUpdates.primary_color,
        brand_secondary_color: brandUpdates.secondary_color,
      })
      .eq('id', user.id)
  }

  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true }
}
