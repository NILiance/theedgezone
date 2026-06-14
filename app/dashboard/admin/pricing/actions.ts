'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const upsertSchema = z.object({
  service_slug: z.string().min(1).max(120),
  plan_monthly_cents: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(10_000_000)])
    .transform((v) => (v === '' ? null : (v as number))),
  plan_annual_cents: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(100_000_000)])
    .transform((v) => (v === '' ? null : (v as number))),
  plan_onetime_cents: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(100_000_000)])
    .transform((v) => (v === '' ? null : (v as number))),
  custom_label: z.string().max(120).optional().transform((v) => (v ? v : null)),
  active: z.coerce.boolean().default(true),
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
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { error } = await supabase.from('service_pricing').upsert({
    service_slug: parsed.data.service_slug,
    plan_monthly_cents: parsed.data.plan_monthly_cents,
    plan_annual_cents: parsed.data.plan_annual_cents,
    plan_onetime_cents: parsed.data.plan_onetime_cents,
    custom_label: parsed.data.custom_label,
    active: parsed.data.active,
  })
  if (error) return { ok: false, message: error.message }

  revalidatePath('/dashboard/admin/pricing')
  revalidatePath(`/services/${parsed.data.service_slug}`)
  revalidatePath('/services')
  return { ok: true }
}
