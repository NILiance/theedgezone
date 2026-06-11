'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export type ProfileState = { error?: string; success?: string } | undefined

const profileSchema = z.object({
  display_name: z.string().min(1, 'Display name required').max(80),
  avatar_url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
})

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireUser()

  const parsed = profileSchema.safeParse({
    display_name: formData.get('display_name'),
    avatar_url: formData.get('avatar_url'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.display_name,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { success: 'Profile updated.' }
}

export async function dismissNilianceBanner() {
  const user = await requireUser()
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ niliance_banner_dismissed_at: new Date().toISOString() })
    .eq('id', user.id)
  revalidatePath('/dashboard', 'layout')
}
