'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const centsField = (max: number) =>
  z
    .union([z.literal(''), z.coerce.number().int().min(0).max(max)])
    .transform((v) => (v === '' ? null : (v as number)))

const upsertSchema = z.object({
  service_slug: z.string().min(1).max(120),
  plan_monthly_cents: centsField(10_000_000),
  plan_annual_cents: centsField(100_000_000),
  plan_onetime_cents: centsField(100_000_000),
  custom_label: z.string().max(120).optional().transform((v) => (v ? v : null)),
  active: z.coerce.boolean().default(true),
  // Optional extras — brand design uses these; other services may add their own.
  revision_price_cents: centsField(10_000_000).optional(),
  first_revision_free: z.coerce.boolean().optional(),
  additional_brand_price_cents: centsField(10_000_000).optional(),
})

export async function upsertServicePricing(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireUser()
  const parsed = upsertSchema.safeParse({
    service_slug: formData.get('service_slug'),
    plan_monthly_cents: formData.get('plan_monthly_cents') ?? '',
    plan_annual_cents: formData.get('plan_annual_cents') ?? '',
    plan_onetime_cents: formData.get('plan_onetime_cents') ?? '',
    custom_label: formData.get('custom_label') ?? undefined,
    active: formData.get('active') === 'on' || formData.get('active') === 'true',
    revision_price_cents: formData.get('revision_price_cents') ?? '',
    first_revision_free: formData.get('first_revision_free') === 'on',
    additional_brand_price_cents: formData.get('additional_brand_price_cents') ?? '',
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  // Only persist extras for services that actually use them — keeps the
  // jsonb column clean for other services that just need plans.
  const extras: Record<string, unknown> = {}
  if (parsed.data.service_slug === 'personal-brand-design') {
    extras.revision_price_cents = parsed.data.revision_price_cents ?? null
    extras.first_revision_free = parsed.data.first_revision_free ?? true
    extras.additional_brand_price_cents =
      parsed.data.additional_brand_price_cents ?? null
  }

  const supabase = await createClient()
  const { error } = await supabase.from('service_pricing').upsert({
    service_slug: parsed.data.service_slug,
    plan_monthly_cents: parsed.data.plan_monthly_cents,
    plan_annual_cents: parsed.data.plan_annual_cents,
    plan_onetime_cents: parsed.data.plan_onetime_cents,
    custom_label: parsed.data.custom_label,
    active: parsed.data.active,
    extras,
  })
  if (error) return { ok: false, message: error.message }

  revalidatePath('/dashboard/admin/pricing')
  revalidatePath(`/services/${parsed.data.service_slug}`)
  revalidatePath('/services')
  return { ok: true }
}
