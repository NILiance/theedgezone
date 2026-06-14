'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export type RewardState = { ok?: boolean; error?: string }

export async function createReward(_prev: RewardState, form: FormData): Promise<RewardState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const name = String(form.get('name') ?? '').trim()
  const points = Number(form.get('points_cost') ?? 0)
  if (!name) return { error: 'Name is required' }
  if (!Number.isFinite(points) || points < 0) return { error: 'Points cost must be ≥ 0' }
  const stockRaw = String(form.get('stock') ?? '').trim()
  const stock = stockRaw === '' ? null : Number(stockRaw)
  const { error } = await supabase.from('reward_items').insert({
    name,
    description: String(form.get('description') ?? '').trim() || null,
    image_url: String(form.get('image_url') ?? '').trim() || null,
    points_cost: Math.round(points),
    stock: stock != null && Number.isFinite(stock) ? Math.round(stock) : null,
    status: 'active',
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/rewards')
  return { ok: true }
}

export async function updateReward(_prev: RewardState, form: FormData): Promise<RewardState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const id = String(form.get('id') ?? '')
  if (!id) return { error: 'Missing id' }
  const update: Record<string, unknown> = {
    name: String(form.get('name') ?? '').trim() || undefined,
    description: String(form.get('description') ?? '').trim() || null,
    image_url: String(form.get('image_url') ?? '').trim() || null,
    points_cost: Math.max(0, Math.round(Number(form.get('points_cost') ?? 0))),
    status: String(form.get('status') ?? 'active'),
    updated_at: new Date().toISOString(),
  }
  const stockRaw = String(form.get('stock') ?? '').trim()
  update.stock = stockRaw === '' ? null : Math.round(Number(stockRaw))
  const { error } = await supabase.from('reward_items').update(update).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/rewards')
  return { ok: true }
}

export async function deleteReward(_prev: RewardState, form: FormData): Promise<RewardState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const id = String(form.get('id') ?? '')
  if (!id) return { error: 'Missing id' }
  const { error } = await supabase.from('reward_items').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/rewards')
  return { ok: true }
}

export async function fulfillRedemption(_prev: RewardState, form: FormData): Promise<RewardState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }
  const id = String(form.get('id') ?? '')
  if (!id) return { error: 'Missing id' }
  const { error } = await supabase
    .from('reward_redemptions')
    .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/rewards')
  return { ok: true }
}
