import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { UsersAdminClient } from './client'

export const metadata = { title: 'Users' }

interface PageProps {
  searchParams: Promise<{ q?: string; role?: string }>
}

export default async function UsersAdminPage({ searchParams }: PageProps) {
  await requireAdmin()
  const sp = await searchParams
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }

  const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
  let users = (usersRes?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    banned_until: u.banned_until,
    email_confirmed_at: (u as { email_confirmed_at?: string | null }).email_confirmed_at ?? null,
  }))

  if (sp.q) {
    const q = sp.q.toLowerCase()
    users = users.filter((u) => (u.email ?? '').toLowerCase().includes(q))
  }

  const userIds = users.map((u) => u.id)
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, user_type, sport, school, points')
      .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']),
    supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']),
  ])
  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const rolesByUserId = new Map<string, string[]>()
  for (const r of roles ?? []) {
    const list = rolesByUserId.get(r.user_id) ?? []
    list.push(r.role)
    rolesByUserId.set(r.user_id, list)
  }

  let rows = users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    display_name: profilesById.get(u.id)?.display_name ?? null,
    user_type: profilesById.get(u.id)?.user_type ?? null,
    sport: profilesById.get(u.id)?.sport ?? null,
    school: profilesById.get(u.id)?.school ?? null,
    points: profilesById.get(u.id)?.points ?? 0,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    banned_until: u.banned_until ?? null,
    email_confirmed_at: u.email_confirmed_at,
    roles: rolesByUserId.get(u.id) ?? [],
  }))

  if (sp.role === 'admin') rows = rows.filter((r) => r.roles.includes('admin'))
  if (sp.role === 'talent') rows = rows.filter((r) => r.user_type === 'talent')
  if (sp.role === 'brand') rows = rows.filter((r) => r.user_type === 'brand')

  const total = users.length
  const adminCount = rows.filter((r) => r.roles.includes('admin')).length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Users</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">User management</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {total} users · {adminCount} admin{adminCount === 1 ? '' : 's'}.
        </p>
      </div>
      <UsersAdminClient rows={rows} filter={{ q: sp.q ?? '', role: sp.role ?? '' }} />
    </div>
  )
}
