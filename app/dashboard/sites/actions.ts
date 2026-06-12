'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { provisionSite } from '@/lib/provisioning'
import { defaultPropsFor } from '@/lib/site-builder/block-types'
import { THEME_PRESETS_BY_ID, type ThemeTokens } from '@/lib/site-builder/theme-presets'
import { LAYOUTS_BY_ID } from '@/lib/site-builder/layouts'
import { SITE_TEMPLATES_BY_ID, templateTokens } from '@/lib/site-builder/site-templates'
import { seedFor } from '@/lib/site-builder/page-templates'
import { env } from '@/lib/env'

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
  page_type: z.string().min(1).max(40).optional(),
})

export async function addPage(formData: FormData) {
  const user = await requireUser()
  const parsed = addPageSchema.safeParse({
    site_id: formData.get('site_id'),
    title: formData.get('title'),
    path: formData.get('path'),
    page_type: formData.get('page_type') || undefined,
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
      page_type: parsed.data.page_type ?? 'custom',
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

  // Seed blocks from the page archetype if one was selected.
  if (parsed.data.page_type) {
    const seedBlocks = seedFor(parsed.data.page_type)
    if (seedBlocks.length) {
      await supabase.from('site_blocks').insert(
        seedBlocks.map((b, idx) => ({
          page_id: page.id,
          position: idx,
          block_type: b.block_type,
          props: b.props,
        }))
      )
    }
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

// ── Layout / site template ──────────────────────────────────────────────────

const setLayoutSchema = z.object({
  site_id: z.string().uuid(),
  layout_id: z.string().min(1).max(40),
})

export async function setLayout(formData: FormData) {
  const user = await requireUser()
  const parsed = setLayoutSchema.safeParse({
    site_id: formData.get('site_id'),
    layout_id: formData.get('layout_id'),
  })
  if (!parsed.success) throw new Error('Invalid form')
  if (!LAYOUTS_BY_ID[parsed.data.layout_id]) throw new Error('Unknown layout')

  const supabase = await createClient()
  const { error } = await supabase
    .from('sites')
    .update({ layout: parsed.data.layout_id })
    .eq('id', parsed.data.site_id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

const applyTemplateSchema = z.object({
  site_id: z.string().uuid(),
  template_id: z.string().min(1).max(60),
})

/**
 * Destructive: overwrites theme, layout, header, footer, and replaces
 * all pages with the template's page set. Caller must confirm.
 */
export async function applySiteTemplate(formData: FormData) {
  const user = await requireUser()
  const parsed = applyTemplateSchema.safeParse({
    site_id: formData.get('site_id'),
    template_id: formData.get('template_id'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const template = SITE_TEMPLATES_BY_ID[parsed.data.template_id]
  if (!template) throw new Error('Template not found')

  const supabase = await createClient()

  // Confirm ownership
  const { data: site } = await supabase
    .from('sites')
    .select('id, user_id')
    .eq('id', parsed.data.site_id)
    .single()
  if (!site || site.user_id !== user.id) throw new Error('Site not found')

  const tokens = templateTokens(template)

  // Update the site bundle in one shot.
  await supabase
    .from('sites')
    .update({
      theme: tokens as unknown as Record<string, unknown>,
      layout: template.layout,
      header: template.header as unknown as Record<string, unknown>,
      footer: template.footer as unknown as Record<string, unknown>,
      template_id: template.id,
    })
    .eq('id', parsed.data.site_id)

  // Wipe existing pages (cascades to blocks via FK).
  await supabase.from('site_pages').delete().eq('site_id', parsed.data.site_id)

  // Recreate pages from the template.
  for (let i = 0; i < template.pages.length; i++) {
    const tp = template.pages[i]!
    const { data: page } = await supabase
      .from('site_pages')
      .insert({
        site_id: parsed.data.site_id,
        title: tp.title,
        path: tp.path,
        position: i,
        page_type: tp.type,
        status: 'draft',
      })
      .select('id')
      .single()

    if (!page) continue
    const seed = tp.seed ?? seedFor(tp.type)
    if (seed.length) {
      await supabase.from('site_blocks').insert(
        seed.map((b, idx) => ({
          page_id: page.id,
          position: idx,
          block_type: b.block_type,
          props: b.props,
        }))
      )
    }
  }

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

// ── Asset uploads ───────────────────────────────────────────────────────────

const uploadAssetSchema = z.object({
  site_id: z.string().uuid().optional(),
})

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
])
const MAX_BYTES = 10 * 1024 * 1024

/**
 * Uploads a file to the `site-assets` storage bucket under
 * `{user_id}/{site_id|root}/{uuid}.{ext}`, records it in site_assets,
 * and returns the public URL.
 */
export async function uploadAsset(formData: FormData): Promise<{ url: string; path: string }> {
  const user = await requireUser()
  const parsed = uploadAssetSchema.safeParse({
    site_id: formData.get('site_id') || undefined,
  })
  if (!parsed.success) throw new Error('Invalid form')

  const file = formData.get('file')
  if (!(file instanceof File)) throw new Error('No file uploaded')

  if (file.size === 0) throw new Error('File is empty')
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large — max ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB`)
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const uid = crypto.randomUUID()
  const path = `${user.id}/${parsed.data.site_id ?? 'shared'}/${uid}.${ext}`

  const supabase = await createClient()
  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    })
  if (uploadError) throw new Error(uploadError.message)

  const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
  const url = pub.publicUrl

  // Record in our index. Best-effort — failure here doesn't unwind the upload.
  await supabase.from('site_assets').insert({
    user_id: user.id,
    site_id: parsed.data.site_id ?? null,
    path,
    url,
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  })

  return { url, path }
}

const deleteAssetSchema = z.object({ path: z.string().min(1) })

export async function deleteAsset(formData: FormData) {
  const user = await requireUser()
  const parsed = deleteAssetSchema.safeParse({ path: formData.get('path') })
  if (!parsed.success) throw new Error('Invalid form')

  // Ownership check via the path prefix (folder is the user id)
  if (!parsed.data.path.startsWith(`${user.id}/`)) {
    throw new Error('Not your file')
  }

  const supabase = await createClient()
  await supabase.storage.from('site-assets').remove([parsed.data.path])
  await supabase.from('site_assets').delete().eq('user_id', user.id).eq('path', parsed.data.path)
}

// ── Galleries ───────────────────────────────────────────────────────────────

const upsertGallerySchema = z.object({
  site_id: z.string().uuid(),
  gallery_id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  images: z.string(),
})

export async function upsertGallery(formData: FormData) {
  const user = await requireUser()
  const parsed = upsertGallerySchema.safeParse({
    site_id: formData.get('site_id'),
    gallery_id: formData.get('gallery_id') || undefined,
    name: formData.get('name'),
    images: formData.get('images'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]!.message)

  let images: Array<{ url: string; alt?: string }>
  try {
    images = JSON.parse(parsed.data.images)
  } catch {
    throw new Error('Invalid images payload')
  }

  const supabase = await createClient()
  // Ownership
  const { data: site } = await supabase
    .from('sites')
    .select('id, user_id')
    .eq('id', parsed.data.site_id)
    .single()
  if (!site || site.user_id !== user.id) throw new Error('Site not found')

  if (parsed.data.gallery_id) {
    const { error } = await supabase
      .from('site_galleries')
      .update({ name: parsed.data.name, images: images as unknown as Record<string, unknown>[] })
      .eq('id', parsed.data.gallery_id)
      .eq('site_id', parsed.data.site_id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('site_galleries').insert({
      site_id: parsed.data.site_id,
      name: parsed.data.name,
      images: images as unknown as Record<string, unknown>[],
    })
    if (error) throw new Error(error.message)
  }

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
}

const deleteGallerySchema = z.object({ gallery_id: z.string().uuid() })

export async function deleteGallery(formData: FormData) {
  const user = await requireUser()
  const parsed = deleteGallerySchema.safeParse({ gallery_id: formData.get('gallery_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { data: gallery } = await supabase
    .from('site_galleries')
    .select('id, site_id, sites!inner(user_id)')
    .eq('id', parsed.data.gallery_id)
    .single()
  const ownerId = (gallery as any)?.sites?.user_id
  if (!gallery || ownerId !== user.id) throw new Error('Gallery not found')

  await supabase.from('site_galleries').delete().eq('id', parsed.data.gallery_id)
  revalidatePath(`/dashboard/sites/${gallery.site_id}`)
}

// quiet the unused-env import for now until next round wires custom domains
void env

// ── Page status + SEO ──────────────────────────────────────────────────────

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
