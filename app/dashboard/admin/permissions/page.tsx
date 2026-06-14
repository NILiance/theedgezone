import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { PermissionsClient } from './client'

export const metadata = { title: 'Permissions' }

export default async function PermissionsAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: perms } = await supabase
    .from('role_permissions')
    .select('role, capability, allowed, description')
    .order('role', { ascending: true })
    .order('capability', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Permissions</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Role permissions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Toggle which capabilities each user role can use. Persisted in{' '}
          <code>role_permissions</code>; application checks read this table to gate UI.
        </p>
      </div>
      <PermissionsClient
        permissions={(perms ?? []) as Array<{
          role: string
          capability: string
          allowed: boolean
          description: string | null
        }>}
      />
    </div>
  )
}
