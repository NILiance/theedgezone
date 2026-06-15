'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type DeleteAddonState = { ok?: boolean; error?: string }
export type RequestQuoteState = { ok?: boolean; error?: string }

/**
 * Delete a generated arsenal asset. Owner only — RLS enforces this on the
 * insert; we double-check here so non-owners get a clean error message.
 */
export async function deleteAddonAction(
  _prev: DeleteAddonState,
  form: FormData
): Promise<DeleteAddonState> {
  const user = await requireUser()
  const addonId = String(form.get('addon_id') ?? '')
  const brandId = String(form.get('brand_id') ?? '')
  if (!addonId || !brandId) return { error: 'Missing addon or brand id.' }

  const supabase = await createClient()
  // Make sure the brand belongs to the user — addons don't have a user_id
  // column so we route through the brand.
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, user_id')
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) {
    return { error: 'Not your brand design.' }
  }

  const { error } = await supabase
    .from('brand_design_addons')
    .delete()
    .eq('id', addonId)
    .eq('brand_design_id', brandId)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true }
}

/**
 * Submit a quote request for an addon. We don't validate field-by-field —
 * admins can chase up over email if a field is sparse. Returns a structured
 * error on hard failures (missing addon, RLS, etc.).
 */
export async function requestQuoteAction(
  _prev: RequestQuoteState,
  form: FormData
): Promise<RequestQuoteState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  const addonId = String(form.get('addon_id') ?? '')
  if (!brandId) return { error: 'Missing brand id.' }

  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, user_id')
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) {
    return { error: 'Not your brand design.' }
  }

  let addonKind: string | null = null
  let addonUrl: string | null = null
  if (addonId) {
    const { data: addon } = await supabase
      .from('brand_design_addons')
      .select('id, kind, url')
      .eq('id', addonId)
      .eq('brand_design_id', brandId)
      .maybeSingle()
    addonKind = addon?.kind ?? null
    addonUrl = addon?.url ?? null
  }

  const qtyRaw = String(form.get('quantity') ?? '').trim()
  const quantity = qtyRaw ? Number(qtyRaw) : null
  const sizes = String(form.get('sizes') ?? '').trim() || null
  const delivery = String(form.get('delivery_address') ?? '').trim() || null
  const notes = String(form.get('notes') ?? '').trim() || null
  const email = String(form.get('contact_email') ?? '').trim() || user.email || null
  const phone = String(form.get('contact_phone') ?? '').trim() || null

  const { error } = await supabase.from('brand_asset_quote_requests').insert({
    brand_design_id: brandId,
    user_id: user.id,
    addon_id: addonId || null,
    addon_kind: addonKind,
    addon_url: addonUrl,
    quantity: typeof quantity === 'number' && !Number.isNaN(quantity) ? quantity : null,
    sizes,
    delivery_address: delivery,
    notes,
    contact_email: email,
    contact_phone: phone,
  })
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true }
}
