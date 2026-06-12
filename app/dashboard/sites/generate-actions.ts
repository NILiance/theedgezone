'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  improveBlockProps,
  generateSeoMeta,
  generateThemeFromVibe,
  generatePage,
  generationConfigured,
  type SeoMeta,
  type GeneratedPage,
} from '@/lib/generate'
import { BLOCK_TYPES_BY_KEY } from '@/lib/site-builder/block-types'
import { defaultTokens, type ThemeTokens } from '@/lib/site-builder/theme-presets'

interface ActionResult<T = unknown> {
  ok: boolean
  data?: T
  message?: string
}

export async function generationAvailable(): Promise<boolean> {
  return generationConfigured()
}

// ── Improve a single block ─────────────────────────────────────────────

const improveBlockSchema = z.object({
  block_id: z.string().uuid(),
  prompt: z.string().min(2).max(2000),
})

export async function improveBlock(formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = improveBlockSchema.safeParse({
    block_id: formData.get('block_id'),
    prompt: formData.get('prompt'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: block } = await supabase
    .from('site_blocks')
    .select('id, block_type, props, page_id, site_pages!inner(site_id, sites!inner(user_id, display_name))')
    .eq('id', parsed.data.block_id)
    .single()
  const ownerId = (block as any)?.site_pages?.sites?.user_id
  const siteId = (block as any)?.site_pages?.site_id
  const siteName = (block as any)?.site_pages?.sites?.display_name
  if (!block || ownerId !== user.id) return { ok: false, message: 'Block not found' }

  const def = BLOCK_TYPES_BY_KEY[block.block_type]
  if (!def) return { ok: false, message: 'Unknown block type' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('sport')
    .eq('id', user.id)
    .maybeSingle()

  const res = await improveBlockProps({
    blockType: block.block_type,
    currentProps: (block.props ?? {}) as Record<string, unknown>,
    context: { siteName: siteName ?? undefined, sport: profile?.sport ?? undefined },
    userPrompt: parsed.data.prompt,
  })
  if (!res.ok) return { ok: false, message: res.error }

  // Merge — don't replace — to preserve keys the model might drop.
  const next = { ...(block.props as Record<string, unknown>), ...res.data.props }
  const { error } = await supabase
    .from('site_blocks')
    .update({ props: next })
    .eq('id', parsed.data.block_id)
  if (error) return { ok: false, message: error.message }

  if (siteId) revalidatePath(`/dashboard/sites/${siteId}`)
  return { ok: true, message: res.data.note ?? 'Done.' }
}

// ── SEO meta generator ─────────────────────────────────────────────────

const seoGenSchema = z.object({ page_id: z.string().uuid() })

export async function generatePageSeo(formData: FormData): Promise<ActionResult<SeoMeta>> {
  const user = await requireUser()
  const parsed = seoGenSchema.safeParse({ page_id: formData.get('page_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }

  const supabase = await createClient()
  const { data: page } = await supabase
    .from('site_pages')
    .select('id, title, path, site_id, sites!inner(user_id)')
    .eq('id', parsed.data.page_id)
    .single()
  const ownerId = (page as any)?.sites?.user_id
  if (!page || ownerId !== user.id) return { ok: false, message: 'Page not found' }

  // Summarise the page body by concatenating block text content.
  const { data: blocks } = await supabase
    .from('site_blocks')
    .select('block_type, props')
    .eq('page_id', parsed.data.page_id)
    .order('position', { ascending: true })

  const summary = (blocks ?? [])
    .map((b) => {
      const p = (b.props ?? {}) as Record<string, unknown>
      const heading = p.heading || p.title || p.content || ''
      const sub = p.subheading || p.description || ''
      return [heading, sub].filter(Boolean).join(' — ')
    })
    .filter(Boolean)
    .join('. ')
    .slice(0, 1200)

  const res = await generateSeoMeta({
    pageTitle: page.title,
    pagePath: page.path,
    bodySummary: summary || 'Personal site for an athlete.',
  })
  if (!res.ok) return { ok: false, message: res.error }

  await supabase
    .from('site_pages')
    .update({ seo: res.data as unknown as Record<string, unknown> })
    .eq('id', parsed.data.page_id)
  revalidatePath(`/dashboard/sites/${page.site_id}`)
  return { ok: true, data: res.data, message: 'SEO meta generated.' }
}

// ── Theme from vibe ───────────────────────────────────────────────────

const themeGenSchema = z.object({
  site_id: z.string().uuid(),
  vibe: z.string().min(3).max(500),
})

export async function generateTheme(formData: FormData): Promise<ActionResult<ThemeTokens>> {
  const user = await requireUser()
  const parsed = themeGenSchema.safeParse({
    site_id: formData.get('site_id'),
    vibe: formData.get('vibe'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: site } = await supabase
    .from('sites')
    .select('id, user_id, theme')
    .eq('id', parsed.data.site_id)
    .single()
  if (!site || site.user_id !== user.id) return { ok: false, message: 'Site not found' }

  const current = { ...defaultTokens(), ...(site.theme as object) } as ThemeTokens
  const res = await generateThemeFromVibe(parsed.data.vibe, current)
  if (!res.ok) return { ok: false, message: res.error }

  await supabase
    .from('sites')
    .update({ theme: res.data as unknown as Record<string, unknown> })
    .eq('id', parsed.data.site_id)
  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
  return { ok: true, data: res.data, message: 'Theme generated. Save to lock in.' }
}

// ── Page from prompt ──────────────────────────────────────────────────

const pageGenSchema = z.object({
  page_id: z.string().uuid(),
  prompt: z.string().max(2000).optional(),
})

export async function regeneratePage(formData: FormData): Promise<ActionResult<GeneratedPage>> {
  const user = await requireUser()
  const parsed = pageGenSchema.safeParse({
    page_id: formData.get('page_id'),
    prompt: formData.get('prompt') || undefined,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: page } = await supabase
    .from('site_pages')
    .select('id, title, path, page_type, site_id, sites!inner(user_id, display_name)')
    .eq('id', parsed.data.page_id)
    .single()
  const ownerId = (page as any)?.sites?.user_id
  const siteName = (page as any)?.sites?.display_name
  if (!page || ownerId !== user.id) return { ok: false, message: 'Page not found' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('sport')
    .eq('id', user.id)
    .maybeSingle()

  const allowedBlockTypes = Object.keys(BLOCK_TYPES_BY_KEY).filter((t) =>
    BLOCK_TYPES_BY_KEY[t]!.category === 'mysite'
  )

  const res = await generatePage({
    pageType: page.page_type ?? 'custom',
    context: { siteName: siteName ?? undefined, sport: profile?.sport ?? undefined },
    userPrompt: parsed.data.prompt,
    availableBlockTypes: allowedBlockTypes,
  })
  if (!res.ok) return { ok: false, message: res.error }

  // Wipe existing blocks and write the new set.
  await supabase.from('site_blocks').delete().eq('page_id', parsed.data.page_id)
  if (res.data.blocks.length > 0) {
    await supabase.from('site_blocks').insert(
      res.data.blocks.map((b, i) => ({
        page_id: parsed.data.page_id,
        position: i,
        block_type: b.block_type,
        props: b.props,
      }))
    )
  }

  revalidatePath(`/dashboard/sites/${page.site_id}`)
  return { ok: true, data: res.data, message: 'Page regenerated.' }
}
