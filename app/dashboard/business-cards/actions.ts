'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { provisionBusinessCard } from '@/lib/provisioning'

export async function createBusinessCard(formData?: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const fromProfile = formData ? formData.get('from_profile') !== 'no' : true
  const result = await provisionBusinessCard(supabase, user.id, undefined, { fromProfile })
  if (!result.entity_id) throw new Error('Failed to create business card')
  redirect(`/dashboard/business-cards/${result.entity_id}`)
}

export type CardState = { ok?: boolean; error?: string }

export async function saveBusinessCard(_prev: CardState, form: FormData): Promise<CardState> {
  const user = await requireUser()
  const supabase = await createClient()
  const id = String(form.get('card_id') ?? '')
  if (!id) return { error: 'Missing id' }
  const { data: card } = await supabase
    .from('digital_business_cards')
    .select('user_id')
    .eq('id', id)
    .single()
  if (!card || card.user_id !== user.id) return { error: 'Not your card' }

  const socials: Record<string, string> = {}
  for (const k of ['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin']) {
    const v = String(form.get(`social_${k}`) ?? '').trim()
    if (v) socials[k] = v
  }
  const update: Record<string, unknown> = {
    display_name: String(form.get('display_name') ?? '').trim() || null,
    title: String(form.get('title') ?? '').trim() || null,
    organization: String(form.get('organization') ?? '').trim() || null,
    tagline: String(form.get('tagline') ?? '').trim() || null,
    phone: String(form.get('phone') ?? '').trim() || null,
    email: String(form.get('email') ?? '').trim() || null,
    website: String(form.get('website') ?? '').trim() || null,
    avatar_url: String(form.get('avatar_url') ?? '').trim() || null,
    logo_url: String(form.get('logo_url') ?? '').trim() || null,
    primary_color: String(form.get('primary_color') ?? '#0a0a0a'),
    secondary_color: String(form.get('secondary_color') ?? '#ffffff'),
    socials,
    status: String(form.get('status') ?? 'draft'),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('digital_business_cards').update(update).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/business-cards/${id}`)
  return { ok: true }
}
