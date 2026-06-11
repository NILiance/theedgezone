'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export type SectionState = { error?: string; success?: string } | undefined

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
  revalidatePath('/dashboard', 'layout')
  return { success: 'Athletic info saved.' }
}

// ── BRAND ─────────────────────────────────────────────────────────────────
const brandSchema = z.object({
  brand_primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/i, 'Must be a hex color like #C8A84E')
    .or(z.literal('')),
  brand_secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/i, 'Must be a hex color')
    .or(z.literal('')),
  brand_tagline: z.string().max(160).optional(),
  brand_voice: z.string().max(2000).optional(),
})

export async function saveBrand(_prev: SectionState, formData: FormData): Promise<SectionState> {
  const user = await requireUser()
  const parsed = brandSchema.safeParse({
    brand_primary_color: formData.get('brand_primary_color'),
    brand_secondary_color: formData.get('brand_secondary_color'),
    brand_tagline: formData.get('brand_tagline'),
    brand_voice: formData.get('brand_voice'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      brand_primary_color: parsed.data.brand_primary_color || null,
      brand_secondary_color: parsed.data.brand_secondary_color || null,
      brand_tagline: parsed.data.brand_tagline || null,
      brand_voice: parsed.data.brand_voice || null,
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

export async function saveSocial(_prev: SectionState, formData: FormData): Promise<SectionState> {
  const user = await requireUser()
  const socials: Record<string, string> = {}
  for (const platform of SOCIAL_PLATFORMS) {
    const value = formData.get(platform)?.toString().trim()
    if (value) socials[platform] = value
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ socials }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: 'Social handles saved.' }
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
