'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const toggleSchema = z.object({
  role: z.string().min(1).max(40),
  capability: z.string().min(1).max(80),
  allowed: z.coerce.boolean(),
})

export async function togglePermission(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = toggleSchema.safeParse({
    role: formData.get('role'),
    capability: formData.get('capability'),
    allowed: formData.get('allowed') === 'on' || formData.get('allowed') === 'true',
  })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }

  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }
  await supabase
    .from('role_permissions')
    .upsert({
      role: parsed.data.role,
      capability: parsed.data.capability,
      allowed: parsed.data.allowed,
    })
  revalidatePath('/dashboard/admin/permissions')
  return { ok: true }
}
