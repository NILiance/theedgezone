'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { generateAddon, type AddonKind } from '@/lib/brand-addons'

export type AddonState = { ok?: boolean; error?: string; url?: string }

const VALID_KINDS: AddonKind[] = [
  'logo_animation',
  'brand_voice_doc',
  'qr_code',
  'email_signature',
  'social_avatars',
  'trading_card',
]

export async function generateAddonAction(
  _prev: AddonState,
  form: FormData
): Promise<AddonState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  const kind = String(form.get('kind') ?? '') as AddonKind
  if (!brandId) return { error: 'Missing brand id' }
  if (!VALID_KINDS.includes(kind)) return { error: 'Unknown add-on type' }
  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, user_id')
    .eq('id', brandId)
    .single()
  if (!brand || brand.user_id !== user.id) return { error: 'Not your brand design' }
  const result = await generateAddon(brandId, kind)
  if (!result.ok) return { error: result.error }
  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true, url: result.url }
}
