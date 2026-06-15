'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { grantAdminRole, suspendUser } from './actions'

interface Row {
  id: string
  email: string
  display_name: string | null
  user_type: string | null
  sport: string | null
  school: string | null
  points: number
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
  roles: string[]
}

interface Props {
  rows: Row[]
  filter: { q: string; role: string }
}

export function UsersAdminClient({ rows, filter }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [search, setSearch] = useState(filter.q)
  const [, startTransition] = useTransition()

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.push(`/dashboard/admin/users?${next.toString()}`))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateParam('q', search.trim())
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email"
            className="min-w-[200px]"
          />
          <Button size="sm" type="submit" variant="outline">
            Search
          </Button>
        </form>
        <select
          value={filter.role}
          onChange={(e) => updateParam('role', e.target.value)}
          className="flex h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
        >
          <option value="">All roles</option>
          <option value="admin">Admins</option>
          <option value="talent">Talent</option>
          <option value="brand">Brand</option>
        </select>
        {(filter.q || filter.role) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearch('')
              startTransition(() => router.push('/dashboard/admin/users'))
            }}
          >
            Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} shown</span>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Roles</th>
              <th className="px-3 py-2 text-left">Last seen</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No users match.
                </td>
              </tr>
            )}
            {rows.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserRow({ user }: { user: Row }) {
  const [isPending, startTransition] = useTransition()
  const isAdmin = user.roles.includes('admin')
  const isSuspended = user.banned_until && new Date(user.banned_until).getTime() > Date.now()

  const toggleAdmin = () => {
    const verb = isAdmin ? 'revoke admin from' : 'grant admin to'
    if (!confirm(`Are you sure you want to ${verb} ${user.email}?`)) return
    const fd = new FormData()
    fd.set('user_id', user.id)
    fd.set('grant', (!isAdmin).toString())
    startTransition(async () => {
      await grantAdminRole(fd)
    })
  }

  const toggleSuspend = () => {
    const verb = isSuspended ? 'restore' : 'suspend'
    if (!confirm(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${user.email}?`)) return
    const fd = new FormData()
    fd.set('user_id', user.id)
    fd.set('suspend', (!isSuspended).toString())
    startTransition(async () => {
      await suspendUser(fd)
    })
  }

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 font-mono text-xs">{user.email}</td>
      <td className="px-3 py-2 text-xs">
        {user.display_name ?? '—'}
        {user.sport && (
          <p className="text-[10px] text-muted-foreground">
            {user.sport}
            {user.school && ` · ${user.school}`}
          </p>
        )}
      </td>
      <td className="px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground">
        {user.user_type ?? '—'}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((r) => (
            <span
              key={r}
              className="text-display rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent"
            >
              {r}
            </span>
          ))}
          {isSuspended && (
            <span className="text-display rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
              suspended
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '—'}
      </td>
      <td className="px-3 py-2 text-right">
        <a
          href={`/dashboard/admin/users/impersonate?user_id=${user.id}&return=/dashboard`}
          className="text-display mr-2 inline-block rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
          title="View site as this user — useful for debugging and demos"
        >
          👁 View as
        </a>
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleAdmin}
          disabled={isPending}
          className="text-xs"
        >
          {isAdmin ? 'Revoke admin' : 'Make admin'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleSuspend}
          disabled={isPending}
          className={`text-xs ${isSuspended ? 'text-success' : 'text-destructive'}`}
        >
          {isSuspended ? 'Restore' : 'Suspend'}
        </Button>
      </td>
    </tr>
  )
}
