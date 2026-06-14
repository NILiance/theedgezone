'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { provisionTalentApp } from '@/lib/provisioning'

export async function createApp() {
  const user = await requireUser()
  const supabase = await createClient()
  const result = await provisionTalentApp(supabase, user.id)
  if (!result.entity_id) throw new Error('Failed to create app')
  redirect(`/dashboard/apps/${result.entity_id}`)
}

const settingsSchema = z.object({
  app_id: z.string().uuid(),
  name: z.string().min(2).max(120),
  tagline: z.string().max(240).optional(),
  description: z.string().max(2000).optional(),
  package_id: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z][a-z0-9_.-]*$/i, 'Use letters, numbers, dots, dashes only'),
  icon_url: z.string().url().max(800).optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  theme_mode: z.enum(['dark', 'light']),
  contact_email: z.string().email().max(160).optional(),
})

export async function updateAppSettings(formData: FormData): Promise<{
  ok: boolean
  message?: string
}> {
  const user = await requireUser()
  const parsed = settingsSchema.safeParse({
    app_id: formData.get('app_id'),
    name: formData.get('name'),
    tagline: formData.get('tagline') || undefined,
    description: formData.get('description') || undefined,
    package_id: formData.get('package_id'),
    icon_url: formData.get('icon_url') || undefined,
    primary_color: formData.get('primary_color'),
    secondary_color: formData.get('secondary_color'),
    theme_mode: formData.get('theme_mode') || 'dark',
    contact_email: formData.get('contact_email') || undefined,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, settings, user_id')
    .eq('id', parsed.data.app_id)
    .single()
  if (!app || app.user_id !== user.id) return { ok: false, message: 'App not found' }

  const existingSettings = (app.settings ?? {}) as Record<string, unknown>
  const settings = {
    ...existingSettings,
    contact_email: parsed.data.contact_email ?? existingSettings.contact_email ?? null,
  }

  await supabase
    .from('talent_apps')
    .update({
      name: parsed.data.name,
      tagline: parsed.data.tagline ?? null,
      description: parsed.data.description ?? null,
      package_id: parsed.data.package_id,
      icon_url: parsed.data.icon_url ?? null,
      primary_color: parsed.data.primary_color,
      secondary_color: parsed.data.secondary_color,
      theme_mode: parsed.data.theme_mode,
      settings,
    })
    .eq('id', parsed.data.app_id)
  revalidatePath(`/dashboard/apps/${parsed.data.app_id}`)
  return { ok: true }
}

const screensSchema = z.object({
  app_id: z.string().uuid(),
  screens: z.string(),
})

export async function updateAppScreens(formData: FormData): Promise<{
  ok: boolean
  message?: string
}> {
  const user = await requireUser()
  const parsed = screensSchema.safeParse({
    app_id: formData.get('app_id'),
    screens: formData.get('screens'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }
  let screens: unknown
  try {
    screens = JSON.parse(parsed.data.screens)
    if (!Array.isArray(screens)) throw new Error('not array')
  } catch {
    return { ok: false, message: 'Screens must be a JSON array.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('talent_apps')
    .update({ screens: screens as Record<string, unknown>[] })
    .eq('id', parsed.data.app_id)
    .eq('user_id', user.id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/dashboard/apps/${parsed.data.app_id}`)
  return { ok: true }
}
