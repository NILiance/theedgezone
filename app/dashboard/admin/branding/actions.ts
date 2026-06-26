'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

export type FaviconState = { error?: string; success?: string } | undefined

const BUCKET = 'site-assets'

/**
 * Upload a favicon. Raster images are normalized to a 64x64 PNG via sharp
 * (favicons render tiny); SVGs pass through. Stored in the public
 * site-assets bucket; the URL is saved on branding_settings and served from
 * the root layout. The whole tree revalidates so the new icon appears.
 */
export async function uploadFavicon(
  _prev: FaviconState,
  formData: FormData
): Promise<FaviconState> {
  await requireAdmin()
  const file = formData.get('favicon')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an image file.' }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'Favicon must be under 2 MB.' }
  }

  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing.' }

  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  let body: Buffer
  let contentType: string
  let ext: string
  try {
    const input = Buffer.from(await file.arrayBuffer())
    if (isSvg) {
      body = input
      contentType = 'image/svg+xml'
      ext = 'svg'
    } else {
      const sharp = (await import('sharp')).default
      body = await sharp(input)
        .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
      contentType = 'image/png'
      ext = 'png'
    }
  } catch {
    return { error: 'Could not read that image. Try a PNG, JPG, or SVG.' }
  }

  const path = `branding/favicon-${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(body), { contentType, upsert: true })
  if (upErr) return { error: `Upload failed: ${upErr.message}` }

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { error: dbErr } = await supabase
    .from('branding_settings')
    .update({ favicon_url: url })
    .eq('id', 1)
  if (dbErr) return { error: dbErr.message }

  revalidatePath('/', 'layout')
  return { success: 'Favicon updated.' }
}

export async function removeFavicon(): Promise<FaviconState> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing.' }
  const { error } = await supabase
    .from('branding_settings')
    .update({ favicon_url: null })
    .eq('id', 1)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: 'Favicon removed.' }
}

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
