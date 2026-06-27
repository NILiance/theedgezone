'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { syncProfile, createNilianceUser, pullProfileFromNiliance } from '@/lib/niliance'
import { sharetribeEnabled } from '@/lib/sharetribe'

export type SectionState = { error?: string; success?: string } | undefined

/**
 * On-demand "Connect to NILiance" — runs the bridge link for the current
 * user (the same flow that fires automatically on signup). Idempotent: if
 * the profile is already linked, it just reports so. No-ops with a clear
 * message when the Sharetribe bridge isn't configured on this deployment.
 */
export async function connectNiliance(): Promise<{
  ok: boolean
  status?: string
  message: string
}> {
  const user = await requireUser()

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('niliance_user_id, niliance_link_status, display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.niliance_user_id) {
    return { ok: true, status: 'linked', message: 'Already connected — your profile syncs automatically.' }
  }

  if (!sharetribeEnabled) {
    return {
      ok: false,
      status: 'unconfigured',
      message: 'NILiance isn’t connected on this site yet. An admin needs to finish the Sharetribe setup first.',
    }
  }

  const status = await createNilianceUser({
    userId: user.id,
    email: user.email ?? '',
    displayName: (profile?.display_name as string | null) ?? null,
    userType: 'talent',
  })
  revalidatePath('/dashboard/profile')

  if (status === 'linked') {
    return {
      ok: true,
      status,
      message: 'Connected! Check your email to set your NILiance password.',
    }
  }
  if (status === 'error') {
    return {
      ok: false,
      status,
      message: 'Connection attempt failed — see Admin → NILiance for the error detail.',
    }
  }
  return { ok: false, status, message: 'NILiance isn’t configured yet.' }
}

/**
 * Pull the latest profile data FROM NILiance into the Edge Zone profile
 * (sport, school, position, jersey, hometown, height/weight, bio, etc.).
 */
export async function syncFromNiliance(): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser()
  if (!sharetribeEnabled) {
    return { ok: false, message: 'NILiance isn’t connected on this site yet.' }
  }
  const res = await pullProfileFromNiliance({ userId: user.id })
  revalidatePath('/dashboard/profile')
  if (!res.ok) return { ok: false, message: res.error ?? 'Sync failed.' }
  return {
    ok: true,
    message: res.fields
      ? `Pulled ${res.fields} field${res.fields === 1 ? '' : 's'} from NILiance. Refresh to see updates.`
      : 'Connected, but no data was found on your NILiance profile to pull in.',
  }
}

// ── BASICS ────────────────────────────────────────────────────────────────
const basicsSchema = z.object({
  display_name: z.string().min(1, 'Full name required').max(80),
  avatar_url: z.string().url().or(z.literal('')).optional(),
  phone: z.string().max(40).optional(),
  street_address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  us_state: z.string().max(4).optional(),
  website_url: z.string().url().or(z.literal('')).optional(),
  weight_lbs: z.coerce.number().int().min(0).max(1000).optional(),
  hometown: z.string().max(80).optional(),
  height_feet: z.coerce.number().int().min(0).max(8).optional(),
  height_inches_only: z.coerce.number().int().min(0).max(11).optional(),
})

export async function saveBasics(_prev: SectionState, formData: FormData): Promise<SectionState> {
  const user = await requireUser()
  const parsed = basicsSchema.safeParse({
    display_name: formData.get('display_name'),
    avatar_url: formData.get('avatar_url'),
    phone: formData.get('phone'),
    street_address: formData.get('street_address'),
    city: formData.get('city'),
    us_state: formData.get('us_state'),
    website_url: formData.get('website_url'),
    weight_lbs: formData.get('weight_lbs'),
    hometown: formData.get('hometown'),
    height_feet: formData.get('height_feet'),
    height_inches_only: formData.get('height_inches_only'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const height_inches =
    parsed.data.height_feet != null && parsed.data.height_inches_only != null
      ? parsed.data.height_feet * 12 + parsed.data.height_inches_only
      : null

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.display_name,
      avatar_url: parsed.data.avatar_url || null,
      phone: parsed.data.phone || null,
      street_address: parsed.data.street_address || null,
      city: parsed.data.city || null,
      us_state: parsed.data.us_state || null,
      website_url: parsed.data.website_url || null,
      weight_lbs: parsed.data.weight_lbs ?? null,
      hometown: parsed.data.hometown || null,
      height_inches,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  void syncProfile({ userId: user.id })
  revalidatePath('/dashboard', 'layout')
  return { success: 'Basics saved.' }
}

// ── ATHLETIC ──────────────────────────────────────────────────────────────
const athleticSchema = z.object({
  sport: z.string().max(60).optional(),
  athletic_position: z.string().max(60).optional(),
  school: z.string().max(120).optional(),
  conference: z.string().max(60).optional(),
  division: z.string().max(60).optional(),
  jersey_number: z.string().max(10).optional(),
  date_of_birth: z.string().optional(),
})

export async function saveAthletic(
  _prev: SectionState,
  formData: FormData
): Promise<SectionState> {
  const user = await requireUser()
  const parsed = athleticSchema.safeParse({
    sport: formData.get('sport'),
    athletic_position: formData.get('athletic_position'),
    school: formData.get('school'),
    conference: formData.get('conference'),
    division: formData.get('division'),
    jersey_number: formData.get('jersey_number'),
    date_of_birth: formData.get('date_of_birth'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      sport: parsed.data.sport || null,
      athletic_position: parsed.data.athletic_position || null,
      school: parsed.data.school || null,
      conference: parsed.data.conference || null,
      division: parsed.data.division || null,
      jersey_number: parsed.data.jersey_number || null,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  void syncProfile({ userId: user.id })
  revalidatePath('/dashboard', 'layout')
  return { success: 'Athletic info saved.' }
}

// ── BRAND ─────────────────────────────────────────────────────────────────
const hexOrEmpty = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/i, 'Must be a hex color like #C8A84E')
  .or(z.literal(''))

const brandSchema = z.object({
  brand_primary_color: hexOrEmpty,
  brand_secondary_color: hexOrEmpty,
  brand_accent_color: hexOrEmpty,
  brand_neutral_color: hexOrEmpty,
  brand_tagline: z.string().max(160).optional(),
  brand_voice: z.string().max(2000).optional(),
  brand_style_seed: z.string().max(240).optional(),
  brand_mood: z.string().max(240).optional(),
  brand_audience: z.string().max(240).optional(),
  brand_font_pair: z.string().max(120).optional(),
  brand_values: z.string().max(2000).optional(),
  brand_inspiration_urls: z.string().max(4000).optional(),
  brand_avoid: z.string().max(2000).optional(),
  // Logo-designer prefs — same ones surfaced on the Brand Design page so
  // editing either place keeps the talent in lockstep.
  brand_initials: z.string().max(8).optional(),
  brand_vibe: z.string().max(60).optional(),
  brand_bg_pref: z.string().max(20).optional(),
  brand_elements: z.string().max(500).optional(),
  brand_include_name: z.coerce.boolean().optional(),
  brand_include_initials: z.coerce.boolean().optional(),
  brand_include_jersey: z.coerce.boolean().optional(),
})

export async function saveBrand(_prev: SectionState, formData: FormData): Promise<SectionState> {
  const user = await requireUser()
  const parsed = brandSchema.safeParse({
    brand_primary_color: formData.get('brand_primary_color'),
    brand_secondary_color: formData.get('brand_secondary_color'),
    brand_accent_color: formData.get('brand_accent_color'),
    brand_neutral_color: formData.get('brand_neutral_color'),
    brand_tagline: formData.get('brand_tagline'),
    brand_voice: formData.get('brand_voice'),
    brand_style_seed: formData.get('brand_style_seed'),
    brand_mood: formData.get('brand_mood'),
    brand_audience: formData.get('brand_audience'),
    brand_font_pair: formData.get('brand_font_pair'),
    brand_values: formData.get('brand_values'),
    brand_inspiration_urls: formData.get('brand_inspiration_urls'),
    brand_avoid: formData.get('brand_avoid'),
    brand_initials: formData.get('brand_initials'),
    brand_vibe: formData.get('brand_vibe'),
    brand_bg_pref: formData.get('brand_bg_pref'),
    brand_elements: formData.get('brand_elements'),
    brand_include_name: formData.has('brand_include_name'),
    brand_include_initials: formData.has('brand_include_initials'),
    brand_include_jersey: formData.has('brand_include_jersey'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const values = (parsed.data.brand_values ?? '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const inspirationUrls = (parsed.data.brand_inspiration_urls ?? '')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      brand_primary_color: parsed.data.brand_primary_color || null,
      brand_secondary_color: parsed.data.brand_secondary_color || null,
      brand_accent_color: parsed.data.brand_accent_color || null,
      brand_neutral_color: parsed.data.brand_neutral_color || null,
      brand_tagline: parsed.data.brand_tagline || null,
      brand_voice: parsed.data.brand_voice || null,
      brand_style_seed: parsed.data.brand_style_seed || null,
      brand_mood: parsed.data.brand_mood || null,
      brand_audience: parsed.data.brand_audience || null,
      brand_font_pair: parsed.data.brand_font_pair || null,
      brand_values: values,
      brand_inspiration_urls: inspirationUrls,
      brand_avoid: parsed.data.brand_avoid || null,
      brand_initials: parsed.data.brand_initials || null,
      brand_vibe: parsed.data.brand_vibe || null,
      brand_bg_pref: parsed.data.brand_bg_pref || 'variety',
      brand_elements: parsed.data.brand_elements || null,
      brand_include_name: parsed.data.brand_include_name ?? true,
      brand_include_initials: parsed.data.brand_include_initials ?? false,
      brand_include_jersey: parsed.data.brand_include_jersey ?? false,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: 'Brand saved.' }
}

// ── STORY ─────────────────────────────────────────────────────────────────
const storySchema = z.object({
  bio: z.string().max(4000).optional(),
  achievements: z.string().max(4000).optional(),
})

export async function saveStory(_prev: SectionState, formData: FormData): Promise<SectionState> {
  const user = await requireUser()
  const parsed = storySchema.safeParse({
    bio: formData.get('bio'),
    achievements: formData.get('achievements'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      bio: parsed.data.bio || null,
      achievements: parsed.data.achievements || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  void syncProfile({ userId: user.id })
  revalidatePath('/dashboard', 'layout')
  return { success: 'Story saved.' }
}

// ── SOCIAL ────────────────────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  'instagram',
  'tiktok',
  'twitter',
  'youtube',
  'facebook',
  'linkedin',
  'snapchat',
] as const

// Platforms whose follower count + engagement rate feed the NILfluence score.
const METRIC_PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube'] as const

export async function saveSocial(_prev: SectionState, formData: FormData): Promise<SectionState> {
  const user = await requireUser()
  const socials: Record<string, string> = {}
  for (const platform of SOCIAL_PLATFORMS) {
    const value = formData.get(platform)?.toString().trim()
    if (value) socials[platform] = value
  }

  // Manual followers + engagement-rate fallback (used when Phyllo isn't on).
  const social_metrics: Record<string, { followers: number; er: number }> = {}
  for (const p of METRIC_PLATFORMS) {
    const followers = Math.max(0, Number(formData.get(`${p}_followers`) ?? 0) || 0)
    const er = Math.max(0, Number(formData.get(`${p}_er`) ?? 0) || 0)
    if (followers > 0 || er > 0) social_metrics[p] = { followers, er }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ socials }).eq('id', user.id)
  if (error) return { error: error.message }
  // social_metrics column may not be applied yet — best-effort, ignore its error.
  await supabase.from('profiles').update({ social_metrics }).eq('id', user.id)
  void syncProfile({ userId: user.id })
  revalidatePath('/dashboard', 'layout')
  return { success: 'Social profile saved.' }
}

// ── CONTACTS ──────────────────────────────────────────────────────────────
const contactsSchema = z.object({
  agency_name: z.string().max(120).optional(),
  agent_name: z.string().max(120).optional(),
  agent_email: z.string().email().or(z.literal('')).optional(),
  agent_phone: z.string().max(40).optional(),
})

export async function saveContacts(
  _prev: SectionState,
  formData: FormData
): Promise<SectionState> {
  const user = await requireUser()
  const parsed = contactsSchema.safeParse({
    agency_name: formData.get('agency_name'),
    agent_name: formData.get('agent_name'),
    agent_email: formData.get('agent_email'),
    agent_phone: formData.get('agent_phone'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      agency_name: parsed.data.agency_name || null,
      agent_name: parsed.data.agent_name || null,
      agent_email: parsed.data.agent_email || null,
      agent_phone: parsed.data.agent_phone || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: 'Contacts saved.' }
}

// ── GOALS ─────────────────────────────────────────────────────────────────
export async function saveGoals(_prev: SectionState, formData: FormData): Promise<SectionState> {
  const user = await requireUser()
  const goals = formData.getAll('goal').map((g) => g.toString())

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ selected_goals: goals })
    .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: 'Goals saved.' }
}
