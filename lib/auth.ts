import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the authenticated user, or redirects to /sign-in.
 * Use in Server Components that should only render for authed users.
 */
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')
  return user
}

/**
 * Returns the current user if any, otherwise null. No redirect.
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Returns the authenticated user only if they have the admin role.
 * Non-admins get bounced to /dashboard. Unauthed users get bounced to /sign-in.
 */
export async function requireAdmin() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()
  if (!data) redirect('/dashboard')
  return user
}
