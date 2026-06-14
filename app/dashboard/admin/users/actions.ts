'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const roleSchema = z.object({
  user_id: z.string().uuid(),
  grant: z.coerce.boolean(),
})

export async function grantAdminRole(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = roleSchema.safeParse({
    user_id: formData.get('user_id'),
    grant: formData.get('grant') === 'on' || formData.get('grant') === 'true',
  })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  if (parsed.data.grant) {
    await supabase
      .from('user_roles')
      .upsert({ user_id: parsed.data.user_id, role: 'admin' })
  } else {
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', parsed.data.user_id)
      .eq('role', 'admin')
  }
  revalidatePath('/dashboard/admin/users')
  return { ok: true }
}

const suspendSchema = z.object({
  user_id: z.string().uuid(),
  suspend: z.coerce.boolean(),
})

export async function suspendUser(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const parsed = suspendSchema.safeParse({
    user_id: formData.get('user_id'),
    suspend: formData.get('suspend') === 'on' || formData.get('suspend') === 'true',
  })
  if (!parsed.success) return { ok: false, message: 'Invalid form' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  await supabase.auth.admin.updateUserById(parsed.data.user_id, {
    ban_duration: parsed.data.suspend ? '8760h' : 'none', // 365 days
  })
  revalidatePath('/dashboard/admin/users')
  return { ok: true }
}
