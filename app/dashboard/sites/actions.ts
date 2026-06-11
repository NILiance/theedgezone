'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export async function createSite() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, brand_primary_color, brand_secondary_color, sport')
    .eq('id', user.id)
    .maybeSingle()

  const baseName = profile?.display_name ?? user.email?.split('@')[0] ?? 'me'
  // Append a short suffix so multiple sites per user don't collide
  let slug = slugify(baseName)
  const { data: existing } = await supabase
    .from('sites')
    .select('slug')
    .eq('user_id', user.id)
  if ((existing ?? []).some((s) => s.slug === slug)) {
    slug = `${slug}-${(existing?.length ?? 0) + 1}`
  }

  const { data: site, error } = await supabase
    .from('sites')
    .insert({
      user_id: user.id,
      slug,
      display_name: profile?.display_name ?? null,
      theme: {
        primary: profile?.brand_primary_color ?? '#C8A84E',
        secondary: profile?.brand_secondary_color ?? '#000000',
      },
      status: 'draft',
    })
    .select('id')
    .single()

  if (error || !site) throw new Error(error?.message ?? 'Failed to create site')

  // Seed the Home page with a hero + text + stats block so the user has
  // something to look at on first open of the editor.
  const { data: home } = await supabase
    .from('site_pages')
    .insert({
      site_id: site.id,
      path: '/',
      title: 'Home',
      position: 0,
    })
    .select('id')
    .single()

  if (home) {
    await supabase.from('site_blocks').insert([
      {
        page_id: home.id,
        position: 0,
        block_type: 'hero',
        props: {
          title: profile?.display_name ?? 'My Brand',
          subtitle: profile?.sport ? `${profile.sport} · NIL Athlete` : 'NIL Athlete',
        },
      },
      {
        page_id: home.id,
        position: 1,
        block_type: 'stats',
        props: {
          items: [
            { value: '—', label: 'Followers' },
            { value: '—', label: 'Engagement' },
            { value: '—', label: 'Career stat' },
          ],
        },
      },
      {
        page_id: home.id,
        position: 2,
        block_type: 'text',
        props: {
          content:
            'Tell your story here. This block holds the headline narrative — what you stand for, what brands should know, how fans should engage.',
        },
      },
    ])
  }

  redirect(`/dashboard/sites/${site.id}`)
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
    props: defaultPropsForType(parsed.data.block_type),
  })

  // Force a re-validate for any site this page belongs to
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

function defaultPropsForType(type: string): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return { title: 'Headline', subtitle: 'Tagline' }
    case 'text':
      return { content: 'Write something compelling here.' }
    case 'stats':
      return {
        items: [
          { value: '—', label: 'Stat one' },
          { value: '—', label: 'Stat two' },
          { value: '—', label: 'Stat three' },
        ],
      }
    case 'gallery':
      return { images: [] }
    case 'sponsors':
      return { logos: [] }
    case 'cta':
      return {
        title: 'Get in touch',
        body: 'Drop a message or a brand request.',
        button_label: 'Contact me',
        button_href: '#',
      }
    case 'contact':
      return { email: '', social: [] }
    case 'video':
      return { url: '' }
    default:
      return {}
  }
}
