'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { provisionEpk } from '@/lib/provisioning'
import { defaultPropsFor } from '@/lib/site-builder/block-types'

export async function createEpk(formData?: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const fromProfile = formData ? formData.get('from_profile') !== 'no' : true
  const result = await provisionEpk(supabase, user.id, undefined, { fromProfile })
  if (!result.entity_id) throw new Error('Failed to create EPK')
  redirect(`/dashboard/epks/${result.entity_id}`)
}

const settingsSchema = z.object({
  epk_id: z.string().uuid(),
  display_name: z.string().max(120).optional(),
  tagline: z.string().max(240).optional(),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  mode: z.enum(['dark', 'light']).optional(),
  font_heading: z.string().max(80).optional(),
})

export async function updateEpkSettings(formData: FormData) {
  const user = await requireUser()
  const parsed = settingsSchema.safeParse({
    epk_id: formData.get('epk_id'),
    display_name: formData.get('display_name') || undefined,
    tagline: formData.get('tagline') || undefined,
    primary: formData.get('primary'),
    secondary: formData.get('secondary'),
    mode: formData.get('mode') || undefined,
    font_heading: formData.get('font_heading') || undefined,
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)
  const fontHeading = parsed.data.font_heading || 'Inter'
  const supabase = await createClient()
  const { error } = await supabase
    .from('epks')
    .update({
      display_name: parsed.data.display_name ?? null,
      tagline: parsed.data.tagline ?? null,
      theme: {
        primary: parsed.data.primary,
        secondary: parsed.data.secondary,
        mode: parsed.data.mode ?? 'dark',
        font_heading: fontHeading,
        font_body: fontHeading,
      },
    })
    .eq('id', parsed.data.epk_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/epks/${parsed.data.epk_id}`)
}

const publishSchema = z.object({ epk_id: z.string().uuid() })

export async function publishEpk(formData: FormData) {
  const user = await requireUser()
  const parsed = publishSchema.safeParse({ epk_id: formData.get('epk_id') })
  if (!parsed.success) throw new Error('Invalid form')
  const supabase = await createClient()
  await supabase
    .from('epks')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', parsed.data.epk_id)
    .eq('user_id', user.id)
  revalidatePath(`/dashboard/epks/${parsed.data.epk_id}`)
}

export async function unpublishEpk(formData: FormData) {
  const user = await requireUser()
  const parsed = publishSchema.safeParse({ epk_id: formData.get('epk_id') })
  if (!parsed.success) throw new Error('Invalid form')
  const supabase = await createClient()
  await supabase
    .from('epks')
    .update({ status: 'draft' })
    .eq('id', parsed.data.epk_id)
    .eq('user_id', user.id)
  revalidatePath(`/dashboard/epks/${parsed.data.epk_id}`)
}

// ── Blocks ────────────────────────────────────────────────────────────────

const addBlockSchema = z.object({
  epk_id: z.string().uuid(),
  block_type: z.string().min(1).max(60),
})

export async function addEpkBlock(formData: FormData) {
  const user = await requireUser()
  const parsed = addBlockSchema.safeParse({
    epk_id: formData.get('epk_id'),
    block_type: formData.get('block_type'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  const supabase = await createClient()
  const { data: epk } = await supabase
    .from('epks')
    .select('id, user_id')
    .eq('id', parsed.data.epk_id)
    .single()
  if (!epk || epk.user_id !== user.id) throw new Error('EPK not found')

  const { data: maxRow } = await supabase
    .from('epk_blocks')
    .select('position')
    .eq('epk_id', parsed.data.epk_id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = (maxRow?.position ?? -1) + 1

  await supabase.from('epk_blocks').insert({
    epk_id: parsed.data.epk_id,
    position: nextPosition,
    block_type: parsed.data.block_type,
    props: defaultPropsFor(parsed.data.block_type),
  })

  revalidatePath(`/dashboard/epks/${parsed.data.epk_id}`)
}

const updatePropsSchema = z.object({
  block_id: z.string().uuid(),
  props: z.string(),
})

export async function updateEpkBlockProps(formData: FormData) {
  const user = await requireUser()
  const parsed = updatePropsSchema.safeParse({
    block_id: formData.get('block_id'),
    props: formData.get('props'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)
  let next: Record<string, unknown>
  try {
    next = JSON.parse(parsed.data.props)
  } catch {
    throw new Error('Invalid block props payload')
  }

  const supabase = await createClient()
  const { data: block } = await supabase
    .from('epk_blocks')
    .select('id, epk_id, epks!inner(user_id)')
    .eq('id', parsed.data.block_id)
    .single()
  const ownerId = (block as { epks?: { user_id?: string } })?.epks?.user_id
  if (!block || ownerId !== user.id) throw new Error('Block not found')

  const { error } = await supabase
    .from('epk_blocks')
    .update({ props: next })
    .eq('id', parsed.data.block_id)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/epks/${block.epk_id}`)
}

const removeSchema = z.object({ block_id: z.string().uuid() })

export async function removeEpkBlock(formData: FormData) {
  const user = await requireUser()
  const parsed = removeSchema.safeParse({ block_id: formData.get('block_id') })
  if (!parsed.success) throw new Error('Invalid form')
  const supabase = await createClient()
  const { data: block } = await supabase
    .from('epk_blocks')
    .select('id, epk_id, epks!inner(user_id)')
    .eq('id', parsed.data.block_id)
    .single()
  const ownerId = (block as { epks?: { user_id?: string } })?.epks?.user_id
  if (!block || ownerId !== user.id) throw new Error('Block not found')
  await supabase.from('epk_blocks').delete().eq('id', parsed.data.block_id)
  revalidatePath(`/dashboard/epks/${block.epk_id}`)
}

const moveSchema = z.object({
  block_id: z.string().uuid(),
  direction: z.enum(['up', 'down']),
})

export async function moveEpkBlock(formData: FormData) {
  const user = await requireUser()
  const parsed = moveSchema.safeParse({
    block_id: formData.get('block_id'),
    direction: formData.get('direction'),
  })
  if (!parsed.success) throw new Error('Invalid form')
  const supabase = await createClient()
  const { data: block } = await supabase
    .from('epk_blocks')
    .select('id, epk_id, position, epks!inner(user_id)')
    .eq('id', parsed.data.block_id)
    .single()
  const ownerId = (block as { epks?: { user_id?: string } })?.epks?.user_id
  if (!block || ownerId !== user.id) throw new Error('Block not found')

  const swapQuery = supabase
    .from('epk_blocks')
    .select('id, position')
    .eq('epk_id', block.epk_id)
    .limit(1)
  const { data: swap } =
    parsed.data.direction === 'up'
      ? await swapQuery.lt('position', block.position).order('position', { ascending: false }).maybeSingle()
      : await swapQuery.gt('position', block.position).order('position', { ascending: true }).maybeSingle()
  if (!swap) return
  await supabase.from('epk_blocks').update({ position: swap.position }).eq('id', block.id)
  await supabase.from('epk_blocks').update({ position: block.position }).eq('id', swap.id)
  revalidatePath(`/dashboard/epks/${block.epk_id}`)
}
