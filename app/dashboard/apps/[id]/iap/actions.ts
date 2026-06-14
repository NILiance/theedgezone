'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type IapState = { ok?: boolean; error?: string }

async function ensureOwner(appId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, user_id')
    .eq('id', appId)
    .single()
  if (!app || app.user_id !== user.id) return { ok: false, error: 'Not your app' }
  return { ok: true }
}

export async function createIap(_prev: IapState, form: FormData): Promise<IapState> {
  const appId = String(form.get('app_id') ?? '')
  const own = await ensureOwner(appId)
  if (!own.ok) return { error: own.error }
  const productId = String(form.get('product_id') ?? '').trim()
  const displayName = String(form.get('display_name') ?? '').trim()
  const description = String(form.get('description') ?? '').trim() || null
  const priceUsd = Number(form.get('price_usd') ?? 0)
  const kind = String(form.get('kind') ?? 'consumable')
  if (!productId) return { error: 'Product ID is required' }
  if (!/^[a-z0-9._]+$/i.test(productId)) return { error: 'Product ID must be alphanumeric, ., or _' }
  if (!displayName) return { error: 'Display name is required' }
  if (!(priceUsd >= 0)) return { error: 'Price must be ≥ 0' }
  if (!['consumable', 'non_consumable', 'subscription'].includes(kind)) {
    return { error: 'Invalid kind' }
  }
  const supabase = await createClient()
  const { error } = await supabase.from('app_iap_products').insert({
    app_id: appId,
    product_id: productId,
    display_name: displayName,
    description,
    price_usd: priceUsd,
    kind,
    status: 'draft',
  })
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/apps/${appId}/iap`)
  return { ok: true }
}

export async function updateIap(_prev: IapState, form: FormData): Promise<IapState> {
  const appId = String(form.get('app_id') ?? '')
  const own = await ensureOwner(appId)
  if (!own.ok) return { error: own.error }
  const id = String(form.get('id') ?? '')
  if (!id) return { error: 'Missing id' }
  const update: Record<string, unknown> = {
    display_name: String(form.get('display_name') ?? '').trim() || undefined,
    description: String(form.get('description') ?? '').trim() || null,
    price_usd: Math.max(0, Number(form.get('price_usd') ?? 0)),
    apple_product_id: String(form.get('apple_product_id') ?? '').trim() || null,
    google_product_id: String(form.get('google_product_id') ?? '').trim() || null,
    status: String(form.get('status') ?? 'draft'),
    updated_at: new Date().toISOString(),
  }
  const supabase = await createClient()
  const { error } = await supabase.from('app_iap_products').update(update).eq('id', id).eq('app_id', appId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/apps/${appId}/iap`)
  return { ok: true }
}

export async function deleteIap(_prev: IapState, form: FormData): Promise<IapState> {
  const appId = String(form.get('app_id') ?? '')
  const own = await ensureOwner(appId)
  if (!own.ok) return { error: own.error }
  const id = String(form.get('id') ?? '')
  if (!id) return { error: 'Missing id' }
  const supabase = await createClient()
  const { error } = await supabase.from('app_iap_products').delete().eq('id', id).eq('app_id', appId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/apps/${appId}/iap`)
  return { ok: true }
}
