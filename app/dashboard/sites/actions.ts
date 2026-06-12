'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { provisionSite } from '@/lib/provisioning'
import { defaultPropsFor } from '@/lib/site-builder/block-types'
import { THEME_PRESETS_BY_ID, type ThemeTokens } from '@/lib/site-builder/theme-presets'

export async function createSite() {
  const user = await requireUser()
  const supabase = await createClient()
  const result = await provisionSite(supabase, user.id)
  if (!result.entity_id) throw new Error('Failed to create site')
  redirect(`/dashboard/sites/${result.entity_id}`)
}

// ── Site settings ──────────────────────────────────────────────────────────

const siteSettingsSchema = z.object({
  site_id: z.string().uuid(),
  display_name: z.string().max(120).optional(),
  tagline: z.string().max(240).optional(),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function updateSiteSettings(formData: FormData) {
  const user = await requireUser()
  const parsed = siteSettingsSchema.safeParse({
    site_id: formData.get('site_id'),
    display_name: formData.get('display_name') || undefined,
    tagline: formData.get('tagline') || undefined,
    primary: formData.get('primary'),
    secondary: formData.get('secondary'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({
      display_name: parsed.data.display_name ?? null,
      tagline: parsed.data.tagline ?? null,
      theme: { primary: parsed.data.primary, secondary: parsed.data.secondary },
    })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

const publishSchema = z.object({
  site_id: z.string().uuid(),
})

export async function publishSite(formData: FormData) {
  const user = await requireUser()
  const parsed = publishSchema.safeParse({ site_id: formData.get('site_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

export async function unpublishSite(formData: FormData) {
  const user = await requireUser()
  const parsed = publishSchema.safeParse({ site_id: formData.get('site_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({ status: 'draft' })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

// ── Pages ──────────────────────────────────────────────────────────────────

const addPageSchema = z.object({
  site_id: z.string().uuid(),
  title: z.string().min(1).max(120),
  path: z
    .string()
    .min(1)
    .max(120)
    .regex(/^\/[a-z0-9-/]*$/i, 'Path must start with / and use letters/numbers/dashes'),
})

export async function addPage(formData: FormData) {
  const user = await requireUser()
  const parsed = addPageSchema.safeParse({
    site_id: formData.get('site_id'),
    title: formData.get('title'),
    path: formData.get('path'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  const supabase = await createClient()
  // Confirm ownership before we insert
  const { data: site } = await supabase
    .from('sites')
    .select('id, user_id')
    .eq('id', parsed.data.site_id)
    .single()
  if (!site || site.user_id !== user.id) throw new Error('Site not found')

  const { data: maxRow } = await supabase
    .from('site_pages')
    .select('position')
    .eq('site_id', parsed.data.site_id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = (maxRow?.position ?? -1) + 1

  const { data: page, error } = await supabase
    .from('site_pages')
    .insert({
      site_id: parsed.data.site_id,
      title: parsed.data.title,
      path: parsed.data.path.toLowerCase(),
      position: nextPosition,
    })
    .select('id')
    .single()

  if (error || !page) {
    const msg = error?.message ?? 'Failed to add page'
    if (msg.toLowerCase().includes('duplicate')) {
      throw new Error('A page with that path already exists.')
    }
    throw new Error(msg)
  }

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

const updatePageSchema = z.object({
  page_id: z.string().uuid(),
  title: z.string().min(1).max(120),
  path: z
    .string()
    .min(1)
    .max(120)
    .regex(/^\/[a-z0-9-/]*$/i),
})

export async function updatePage(formData: FormData) {
  const user = await requireUser()
  const parsed = updatePageSchema.safeParse({
    page_id: formData.get('page_id'),
    title: formData.get('title'),
    path: formData.get('path'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  const supabase = await createClient()
  const { data: page } = await supabase
    .from('site_pages')
    .select('id, site_id, sites!inner(user_id)')
    .eq('id', parsed.data.page_id)
    .single()
  const ownerId = (page as any)?.sites?.user_id
  if (!page || ownerId !== user.id) throw new Error('Page not found')

  const { error } = await supabase
    .from('site_pages')
    .update({ title: parsed.data.title, path: parsed.data.path.toLowerCase() })
    .eq('id', parsed.data.page_id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${page.site_id}`)
}

const deletePageSchema = z.object({ page_id: z.string().uuid() })

export async function deletePage(formData: FormData) {
  const user = await requireUser()
  const parsed = deletePageSchema.safeParse({ page_id: formData.get('page_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { data: page } = await supabase
    .from('site_pages')
    .select('id, path, site_id, sites!inner(user_id)')
    .eq('id', parsed.data.page_id)
    .single()
  const ownerId = (page as any)?.sites?.user_id
  if (!page || ownerId !== user.id) throw new Error('Page not found')
  if (page.path === '/') throw new Error('Cannot delete the Home page')

  const { error } = await supabase
    .from('site_pages')
    .delete()
    .eq('id', parsed.data.page_id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${page.site_id}`)
}

// ── Blocks ──────────────────────────────────────────────────────────────────

const addBlockSchema = z.object({
  page_id: z.string().uuid(),
  block_type: z.string().min(1).max(60),
})

export async function addBlock(formData: FormData) {
  const user = await requireUser()
  const parsed = addBlockSchema.safeParse({
    page_id: formData.get('page_id'),
    block_type: formData.get('block_type'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  const supabase = await createClient()
  const { data: maxRow } = await supabase
    .from('site_blocks')
    .select('position')
    .eq('page_id', parsed.data.page_id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = (maxRow?.position ?? -1) + 1

  await supabase.from('site_blocks').insert({
    page_id: parsed.data.page_id,
    position: nextPosition,
    block_type: parsed.data.block_type,
    props: defaultPropsFor(parsed.data.block_type),
  })

  const { data: page } = await supabase
    .from('site_pages')
    .select('site_id')
    .eq('id', parsed.data.page_id)
    .single()
  if (page?.site_id) {
    revalidatePath(`/dashboard/sites/${page.site_id}`)
  }
  void user
}

const updateBlockSchema = z.object({
  block_id: z.string().uuid(),
  props: z.string(), // JSON string from the form
})

export async function updateBlockProps(formData: FormData) {
  const user = await requireUser()
  const parsed = updateBlockSchema.safeParse({
    block_id: formData.get('block_id'),
    props: formData.get('props'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  let nextProps: Record<string, unknown>
  try {
    nextProps = JSON.parse(parsed.data.props)
  } catch {
    throw new Error('Invalid block props payload')
  }

  const supabase = await createClient()
  const { data: block } = await supabase
    .from('site_blocks')
    .select('id, page_id, site_pages!inner(site_id, sites!inner(user_id))')
    .eq('id', parsed.data.block_id)
    .single()
  const ownerId = (block as any)?.site_pages?.sites?.user_id
  const siteId = (block as any)?.site_pages?.site_id
  if (!block || ownerId !== user.id) throw new Error('Block not found')

  const { error } = await supabase
    .from('site_blocks')
    .update({ props: nextProps })
    .eq('id', parsed.data.block_id)
  if (error) throw new Error(error.message)

  if (siteId) revalidatePath(`/dashboard/sites/${siteId}`)
}

const removeBlockSchema = z.object({ block_id: z.string().uuid() })

export async function removeBlock(formData: FormData) {
  const user = await requireUser()
  const parsed = removeBlockSchema.safeParse({ block_id: formData.get('block_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { data: block } = await supabase
    .from('site_blocks')
    .select('id, page_id, site_pages!inner(site_id, sites!inner(user_id))')
    .eq('id', parsed.data.block_id)
    .single()
  const ownerId = (block as any)?.site_pages?.sites?.user_id
  const siteId = (block as any)?.site_pages?.site_id
  if (!block || ownerId !== user.id) throw new Error('Block not found')

  const { error } = await supabase
    .from('site_blocks')
    .delete()
    .eq('id', parsed.data.block_id)
  if (error) throw new Error(error.message)

  if (siteId) revalidatePath(`/dashboard/sites/${siteId}`)
}

const moveBlockSchema = z.object({
  block_id: z.string().uuid(),
  direction: z.enum(['up', 'down']),
})

export async function moveBlock(formData: FormData) {
  const user = await requireUser()
  const parsed = moveBlockSchema.safeParse({
    block_id: formData.get('block_id'),
    direction: formData.get('direction'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { data: block } = await supabase
    .from('site_blocks')
    .select('id, page_id, position, site_pages!inner(site_id, sites!inner(user_id))')
    .eq('id', parsed.data.block_id)
    .single()
  const ownerId = (block as any)?.site_pages?.sites?.user_id
  const siteId = (block as any)?.site_pages?.site_id
  if (!block || ownerId !== user.id) throw new Error('Block not found')

  // Find adjacent block on the same page in the move direction.
  // up   → block with highest position less than current.position
  // down → block with lowest  position greater than current.position
  const direction = parsed.data.direction
  const swapQuery = supabase
    .from('site_blocks')
    .select('id, position')
    .eq('page_id', block.page_id)
    .limit(1)
  const { data: swap } =
    direction === 'up'
      ? await swapQuery.lt('position', block.position).order('position', { ascending: false }).maybeSingle()
      : await swapQuery.gt('position', block.position).order('position', { ascending: true }).maybeSingle()

  if (!swap) {
    // Already at the edge — no-op
    return
  }

  // Swap positions
  await supabase
    .from('site_blocks')
    .update({ position: swap.position })
    .eq('id', block.id)
  await supabase
    .from('site_blocks')
    .update({ position: block.position })
    .eq('id', swap.id)

  if (siteId) revalidatePath(`/dashboard/sites/${siteId}`)
}

// ── Theme / header / footer / social ────────────────────────────────────────

const themeSchema = z.object({
  site_id: z.string().uuid(),
  tokens: z.string(),
})

export async function updateTheme(formData: FormData) {
  const user = await requireUser()
  const parsed = themeSchema.safeParse({
    site_id: formData.get('site_id'),
    tokens: formData.get('tokens'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  let tokens: ThemeTokens
  try {
    tokens = JSON.parse(parsed.data.tokens) as ThemeTokens
  } catch {
    throw new Error('Invalid theme tokens payload')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({ theme: tokens as unknown as Record<string, unknown> })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

const applyPresetSchema = z.object({
  site_id: z.string().uuid(),
  preset_id: z.string().min(1).max(60),
})

export async function applyThemePreset(formData: FormData) {
  const user = await requireUser()
  const parsed = applyPresetSchema.safeParse({
    site_id: formData.get('site_id'),
    preset_id: formData.get('preset_id'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const preset = THEME_PRESETS_BY_ID[parsed.data.preset_id]
  if (!preset) throw new Error('Preset not found')

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({ theme: preset.tokens as unknown as Record<string, unknown> })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

const headerSchema = z.object({
  site_id: z.string().uuid(),
  header: z.string(),
})

export async function updateHeader(formData: FormData) {
  const user = await requireUser()
  const parsed = headerSchema.safeParse({
    site_id: formData.get('site_id'),
    header: formData.get('header'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  let header: Record<string, unknown>
  try {
    header = JSON.parse(parsed.data.header)
  } catch {
    throw new Error('Invalid header payload')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({ header })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

const footerSchema = z.object({
  site_id: z.string().uuid(),
  footer: z.string(),
})

export async function updateFooter(formData: FormData) {
  const user = await requireUser()
  const parsed = footerSchema.safeParse({
    site_id: formData.get('site_id'),
    footer: formData.get('footer'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  let footer: Record<string, unknown>
  try {
    footer = JSON.parse(parsed.data.footer)
  } catch {
    throw new Error('Invalid footer payload')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({ footer })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

const socialSchema = z.object({
  site_id: z.string().uuid(),
  social: z.string(),
})

export async function updateSocial(formData: FormData) {
  const user = await requireUser()
  const parsed = socialSchema.safeParse({
    site_id: formData.get('site_id'),
    social: formData.get('social'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  let social: Record<string, string>
  try {
    social = JSON.parse(parsed.data.social)
  } catch {
    throw new Error('Invalid social payload')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({ social })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

// ── Page SEO + status ───────────────────────────────────────────────────────

const pageStatusSchema = z.object({
  page_id: z.string().uuid(),
  status: z.enum(['published', 'draft']),
})

export async function updatePageStatus(formData: FormData) {
  const user = await requireUser()
  const parsed = pageStatusSchema.safeParse({
    page_id: formData.get('page_id'),
    status: formData.get('status'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { data: page } = await supabase
    .from('site_pages')
    .select('id, site_id, sites!inner(user_id)')
    .eq('id', parsed.data.page_id)
    .single()
  const ownerId = (page as any)?.sites?.user_id
  if (!page || ownerId !== user.id) throw new Error('Page not found')

  const { error } = await supabase
    .from('site_pages')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.page_id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${page.site_id}`)
}

const pageSeoSchema = z.object({
  page_id: z.string().uuid(),
  seo: z.string(),
})

export async function updatePageSeo(formData: FormData) {
  const user = await requireUser()
  const parsed = pageSeoSchema.safeParse({
    page_id: formData.get('page_id'),
    seo: formData.get('seo'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  let seo: Record<string, unknown>
  try {
    seo = JSON.parse(parsed.data.seo)
  } catch {
    throw new Error('Invalid SEO payload')
  }

  const supabase = await createClient()
  const { data: page } = await supabase
    .from('site_pages')
    .select('id, site_id, sites!inner(user_id)')
    .eq('id', parsed.data.page_id)
    .single()
  const ownerId = (page as any)?.sites?.user_id
  if (!page || ownerId !== user.id) throw new Error('Page not found')

  const { error } = await supabase
    .from('site_pages')
    .update({ seo })
    .eq('id', parsed.data.page_id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${page.site_id}`)
}
