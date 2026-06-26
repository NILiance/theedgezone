'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export type CreateUserResult = {
  ok: boolean
  message?: string
  tempPassword?: string
  userId?: string
}

/**
 * Manually create a user from the admin panel. Creates an auto-confirmed
 * auth user (so they can sign in / reset immediately), sets the profile
 * type, optionally grants admin, and fires the welcome email + NILiance
 * bridge — the same side effects as a normal signup.
 *
 * If no password is supplied we generate a temporary one and hand it back
 * to the admin to share; the user can also use "Forgot password."
 */
export async function createUser(formData: FormData): Promise<CreateUserResult> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const displayName = String(formData.get('display_name') ?? '').trim()
  const userTypeRaw = String(formData.get('user_type') ?? 'talent')
  const userType = ['talent', 'brand'].includes(userTypeRaw) ? userTypeRaw : 'talent'
  const passwordInput = String(formData.get('password') ?? '')
  const makeAdmin = formData.get('make_admin') === 'on' || formData.get('make_admin') === 'true'

  if (!/.+@.+\..+/.test(email)) return { ok: false, message: 'Enter a valid email address.' }
  if (passwordInput && passwordInput.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }

  const generated = !passwordInput
  const password = passwordInput || randomBytes(12).toString('base64url')

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })
  if (error || !data?.user) {
    return { ok: false, message: error?.message ?? 'Could not create the user.' }
  }
  const userId = data.user.id

  // The on_auth_user_created trigger inserts the profile with display_name;
  // set user_type (and re-affirm the name) here.
  await supabase
    .from('profiles')
    .update({ user_type: userType, ...(displayName ? { display_name: displayName } : {}) })
    .eq('id', userId)

  if (makeAdmin) {
    await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' })
  }

  // Welcome email (no password) + NILiance bridge — best-effort, non-blocking.
  try {
    const { welcomeEmail } = await import('@/lib/emails/welcome')
    const { sendEmail } = await import('@/lib/resend')
    const { subject, html } = welcomeEmail({ display_name: displayName || email.split('@')[0]! })
    void sendEmail({ to: email, subject, html, templateKey: 'welcome', metadata: { user_id: userId } })
  } catch {
    // ignore
  }
  try {
    const { createNilianceUser } = await import('@/lib/niliance')
    void createNilianceUser({ userId, email, displayName: displayName || null, userType })
  } catch {
    // ignore
  }

  revalidatePath('/dashboard/admin/users')
  return {
    ok: true,
    userId,
    message: generated
      ? 'User created with a temporary password (below). Share it securely, or have them use “Forgot password.”'
      : 'User created. They can sign in with the password you set, or use “Forgot password.”',
    tempPassword: generated ? password : undefined,
  }
}

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

/** Manually confirm a user's email (for users who never clicked the link). */
export async function confirmUser(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin()
  const userId = String(formData.get('user_id') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, message: 'Invalid user id' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, message: 'Service role key missing' }

  const { error } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true })
  if (error) return { ok: false, message: error.message }
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
