'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { provisionTalentApp } from '@/lib/provisioning'

export async function createApp(formData?: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const fromProfile = formData ? formData.get('from_profile') !== 'no' : true
  const result = await provisionTalentApp(supabase, user.id, undefined, { fromProfile })
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
  contact_email: z.string().email().max(160).optional(),
})

// Settings tab now owns only app metadata; colors/icon/mode live in Design (saved
// via updateAppBuild), so this no longer touches them.
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
      settings,
    })
    .eq('id', parsed.data.app_id)
  revalidatePath(`/dashboard/apps/${parsed.data.app_id}`)
  return { ok: true }
}

/**
 * Unified save for the visual builder — persists the Design theme, the bottom
 * nav, and the screens together. Theme lives in settings.theme + nav in
 * settings.nav; primary/secondary/mode columns are kept in sync for the Expo
 * generator and other readers.
 */
export async function updateAppBuild(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const appId = String(formData.get('app_id') ?? '')
  if (!appId) return { ok: false, message: 'Missing app id' }
  let theme: Record<string, unknown> = {}
  let nav: unknown
  let screens: unknown
  let extensions: unknown
  let commerce: unknown
  let integrations: unknown
  try {
    theme = JSON.parse(String(formData.get('theme') ?? '{}')) as Record<string, unknown>
    nav = JSON.parse(String(formData.get('nav') ?? '[]'))
    screens = JSON.parse(String(formData.get('screens') ?? '[]'))
    extensions = JSON.parse(String(formData.get('extensions') ?? '[]'))
    commerce = JSON.parse(String(formData.get('commerce') ?? '{}'))
    integrations = JSON.parse(String(formData.get('integrations') ?? '{}'))
    if (!Array.isArray(nav) || !Array.isArray(screens) || typeof theme !== 'object') throw new Error('bad')
    if (!Array.isArray(extensions)) extensions = []
    if (!commerce || typeof commerce !== 'object' || Array.isArray(commerce)) commerce = {}
    if (!integrations || typeof integrations !== 'object' || Array.isArray(integrations)) integrations = {}
  } catch {
    return { ok: false, message: 'Invalid build payload.' }
  }
  const iconUrl = String(formData.get('icon_url') ?? '').trim()

  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, settings, user_id')
    .eq('id', appId)
    .single()
  if (!app || app.user_id !== user.id) return { ok: false, message: 'App not found' }

  const settings = { ...((app.settings ?? {}) as Record<string, unknown>), theme, nav, extensions, commerce, integrations }
  const hex = /^#[0-9a-fA-F]{6}$/
  const update: Record<string, unknown> = {
    settings,
    screens: screens as Record<string, unknown>[],
    theme_mode: theme.mode === 'light' ? 'light' : 'dark',
    icon_url: iconUrl || null,
  }
  if (typeof theme.primary === 'string' && hex.test(theme.primary)) update.primary_color = theme.primary
  if (typeof theme.secondary === 'string' && hex.test(theme.secondary)) update.secondary_color = theme.secondary

  const { error } = await supabase.from('talent_apps').update(update).eq('id', appId).eq('user_id', user.id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/dashboard/apps/${appId}`)
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

/** Saves the talent's payout method (Earnings tab) into settings.payout. */
export async function updateAppPayout(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const appId = String(formData.get('app_id') ?? '')
  if (!appId) return { ok: false, message: 'Missing app id' }
  const method = String(formData.get('method') ?? '')
  const handle = String(formData.get('handle') ?? '')
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('settings, user_id')
    .eq('id', appId)
    .single()
  if (!app || app.user_id !== user.id) return { ok: false, message: 'App not found' }
  const settings = { ...((app.settings ?? {}) as Record<string, unknown>), payout: { method, handle } }
  const { error } = await supabase.from('talent_apps').update({ settings }).eq('id', appId).eq('user_id', user.id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/dashboard/apps/${appId}`)
  return { ok: true }
}

/** Merges publish fields (status, store links, privacy policy) into store_listing. */
export async function updateAppPublish(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const appId = String(formData.get('app_id') ?? '')
  if (!appId) return { ok: false, message: 'Missing app id' }
  let patch: Record<string, unknown> = {}
  try {
    const parsed = JSON.parse(String(formData.get('patch') ?? '{}'))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) patch = parsed
  } catch {
    return { ok: false, message: 'Invalid publish payload.' }
  }
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('store_listing, user_id')
    .eq('id', appId)
    .single()
  if (!app || app.user_id !== user.id) return { ok: false, message: 'App not found' }
  const store_listing = { ...((app.store_listing ?? {}) as Record<string, unknown>), ...patch }
  const { error } = await supabase
    .from('talent_apps')
    .update({ store_listing })
    .eq('id', appId)
    .eq('user_id', user.id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/dashboard/apps/${appId}`)
  return { ok: true }
}

export async function updateAppStoreListing(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const appId = String(formData.get('app_id') ?? '')
  if (!appId) return { ok: false, message: 'Missing app id' }
  let listing: Record<string, unknown> = {}
  try {
    const parsed = JSON.parse(String(formData.get('store_listing') ?? '{}'))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      listing = parsed as Record<string, unknown>
    }
  } catch {
    return { ok: false, message: 'Listing must be a JSON object.' }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from('talent_apps')
    .update({ store_listing: listing })
    .eq('id', appId)
    .eq('user_id', user.id)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/dashboard/apps/${appId}`)
  return { ok: true }
}
