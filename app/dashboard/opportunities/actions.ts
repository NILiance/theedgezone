'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createSharetribeOpportunity, closeSharetribeOpportunity } from '@/lib/opportunities'

const upsertSchema = z.object({
  opportunity_id: z.string().uuid().optional(),
  title: z.string().min(3).max(180),
  description: z.string().min(10).max(8000),
  category: z.string().max(80).optional(),
  audience: z.enum(['talent', 'brand', 'everyone']).default('talent'),
  price_cents: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(100_000_000)])
    .transform((v) => (v === '' ? null : (v as number))),
  currency: z.string().min(3).max(8).default('usd'),
  location: z.string().max(120).optional(),
  deadline_at: z.string().optional(),
  contact_email: z.string().email().max(160).optional(),
  external_url: z.string().url().max(500).optional(),
  publish_to_sharetribe: z.coerce.boolean().default(false),
})

export async function upsertOpportunity(
  formData: FormData
): Promise<{ ok: boolean; message?: string; id?: string }> {
  const user = await requireUser()
  const parsed = upsertSchema.safeParse({
    opportunity_id: formData.get('opportunity_id') || undefined,
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category') || undefined,
    audience: formData.get('audience') || 'talent',
    price_cents: formData.get('price_cents') ?? '',
    currency: formData.get('currency') || 'usd',
    location: formData.get('location') || undefined,
    deadline_at: formData.get('deadline_at') || undefined,
    contact_email: formData.get('contact_email') || undefined,
    external_url: formData.get('external_url') || undefined,
    publish_to_sharetribe:
      formData.get('publish_to_sharetribe') === 'on' ||
      formData.get('publish_to_sharetribe') === 'true',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()

  // Mirror to Sharetribe if requested AND not yet mirrored
  let listingUuid: string | null = null
  if (parsed.data.publish_to_sharetribe && !parsed.data.opportunity_id) {
    const stResp = await createSharetribeOpportunity({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      price_cents: parsed.data.price_cents ?? undefined,
      currency: parsed.data.currency,
    })
    if (!stResp.ok) {
      return { ok: false, message: `Sharetribe sync failed: ${stResp.error}` }
    }
    listingUuid = stResp.listingUuid ?? null
  }

  const row: Record<string, unknown> = {
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category ?? null,
    audience: parsed.data.audience,
    price_cents: parsed.data.price_cents,
    currency: parsed.data.currency,
    location: parsed.data.location ?? null,
    deadline_at: parsed.data.deadline_at ? new Date(parsed.data.deadline_at).toISOString() : null,
    contact_email: parsed.data.contact_email ?? null,
    external_url: parsed.data.external_url ?? null,
    status: 'published',
    posted_by: user.id,
  }
  if (listingUuid) row.listing_uuid = listingUuid

  if (parsed.data.opportunity_id) {
    const { error } = await supabase
      .from('opportunities')
      .update(row)
      .eq('id', parsed.data.opportunity_id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { data, error } = await supabase
      .from('opportunities')
      .insert(row)
      .select('id')
      .single()
    if (error || !data) return { ok: false, message: error?.message ?? 'Insert failed' }
    revalidatePath('/opportunities')
    revalidatePath('/dashboard/opportunities')
    return { ok: true, id: data.id as string }
  }

  revalidatePath('/opportunities')
  revalidatePath('/dashboard/opportunities')
  revalidatePath('/dashboard/admin/niliance')
  return { ok: true, id: parsed.data.opportunity_id }
}

const closeSchema = z.object({ opportunity_id: z.string().uuid() })

export async function closeOpportunity(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = closeSchema.safeParse({ opportunity_id: formData.get('opportunity_id') })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('opportunities')
    .select('id, listing_uuid, posted_by')
    .eq('id', parsed.data.opportunity_id)
    .single()
  if (!row) return { ok: false, message: 'Opportunity not found' }
  if (row.posted_by !== user.id) {
    // Allow admin to close anyone's opportunity
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!roleRow) return { ok: false, message: "Not your opportunity" }
  }

  if (row.listing_uuid) {
    await closeSharetribeOpportunity(row.listing_uuid)
  }
  await supabase
    .from('opportunities')
    .update({ status: 'closed' })
    .eq('id', parsed.data.opportunity_id)

  revalidatePath('/opportunities')
  revalidatePath('/dashboard/opportunities')
  return { ok: true }
}
