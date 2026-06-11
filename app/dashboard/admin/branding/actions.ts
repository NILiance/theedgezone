'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

const schema = z.object({
  logo_height_nav: z.coerce.number().int().min(16).max(200),
  logo_height_footer: z.coerce.number().int().min(16).max(200),
  tagline: z.string().min(1).max(120),
})

export type BrandingState = { error?: string; success?: string } | undefined

export async function updateBranding(
  _prev: BrandingState,
  formData: FormData
): Promise<BrandingState> {
  await requireAdmin()

  const parsed = schema.safeParse({
    logo_height_nav: formData.get('logo_height_nav'),
    logo_height_footer: formData.get('logo_height_footer'),
    tagline: formData.get('tagline'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('branding_settings')
    .update(parsed.data)
    .eq('id', 1)

  if (error) return { error: error.message }

  // Wordmark renders on every page, so invalidate the whole tree.
  revalidatePath('/', 'layout')
  return { success: 'Branding settings saved.' }
}
