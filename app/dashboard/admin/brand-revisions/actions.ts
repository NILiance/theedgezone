'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export type DeliverState = { ok?: boolean; error?: string }

/**
 * Upload the revised concept image, attach it to the revision row,
 * append it to logo_concepts so it surfaces in the talent's studio,
 * and mark the revision delivered.
 */
export async function deliverRevisionAction(
  _prev: DeliverState,
  form: FormData
): Promise<DeliverState> {
  const admin = await requireAdmin()
  const revisionId = String(form.get('revision_id') ?? '')
  const brandId = String(form.get('brand_id') ?? '')
  const adminNote = String(form.get('admin_note') ?? '').trim()
  const file = form.get('file')
  if (!revisionId || !brandId) return { error: 'Missing revision id or brand id' }
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Pick a revised image file to upload.' }
  }

  const supabase = createServiceClient()
  if (!supabase) return { error: 'Service role key missing' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const safeExt = ext === 'jpg' || ext === 'jpeg' ? 'jpg' : 'png'
  const path = `${brandId}/revisions/${revisionId}.${safeExt}`
  const arrayBuf = await file.arrayBuffer()
  const { error: uploadErr } = await supabase.storage
    .from('brand-assets')
    .upload(path, new Uint8Array(arrayBuf), {
      contentType: file.type || `image/${safeExt}`,
      upsert: true,
    })
  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` }

  const publicUrl = supabase.storage.from('brand-assets').getPublicUrl(path).data.publicUrl

  // Stamp the revision row.
  const { error: revErr } = await supabase
    .from('brand_design_revisions')
    .update({
      status: 'delivered',
      delivered_concept_url: publicUrl,
      delivered_at: new Date().toISOString(),
      delivered_by: admin.id,
    })
    .eq('id', revisionId)
  if (revErr) return { error: revErr.message }

  // Also drop it into logo_concepts so the talent sees it as a new concept
  // in their studio — round 4 reserved for revisions.
  await supabase.from('logo_concepts').insert({
    brand_design_id: brandId,
    round: 4,
    prompt: adminNote || 'Admin-delivered revision',
    provider: 'admin',
    image_url: publicUrl,
    thumbnail_url: publicUrl,
    metadata: { source: 'revision', revision_id: revisionId },
  })

  revalidatePath('/dashboard/admin/brand-revisions')
  revalidatePath(`/dashboard/admin/brands/${brandId}`)
  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true }
}
