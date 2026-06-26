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

/**
 * Resolve the current user's role context: their user_type (talent | brand)
 * and whether they're an admin. Used to gate the NILiance Opportunities /
 * Talent Directory views (talent-only vs brand-only, admins bypass).
 */
export async function getUserContext(): Promise<{
  user: Awaited<ReturnType<typeof getCurrentUser>>
  userType: string | null
  isAdmin: boolean
}> {
  const user = await getCurrentUser()
  if (!user) return { user: null, userType: null, isAdmin: false }
  const supabase = await createClient()
  const [{ data: profile }, { data: adminRow }] = await Promise.all([
    supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle(),
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle(),
  ])
  return {
    user,
    userType: (profile?.user_type as string | null) ?? null,
    isAdmin: Boolean(adminRow),
  }
}
