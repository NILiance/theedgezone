'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  grantAdminRole,
  suspendUser,
  createUser,
  confirmUser,
  type CreateUserResult,
} from './actions'

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
  email_confirmed_at: string | null
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
  const [addOpen, setAddOpen] = useState(false)

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.push(`/dashboard/admin/users?${next.toString()}`))
  }

  return (
    <div className="space-y-4">
      {addOpen && <AddUserModal onClose={() => setAddOpen(false)} />}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          + Add user
        </Button>
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

function AddUserModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<CreateUserResult | null>(null)
  const [copied, setCopied] = useState(false)

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setResult(null)
    startTransition(async () => {
      const res = await createUser(fd)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  const done = () => {
    router.refresh()
    onClose()
  }

  // Success view — show the temp password (if generated) before closing.
  if (result?.ok) {
    return (
      <Overlay onClose={done}>
        <div className="p-6">
          <p className="text-display text-lg font-black text-success">✓ User created</p>
          <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
          {result.tempPassword && (
            <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-panel-elevated p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Temporary password
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-sm">{result.tempPassword}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(result.tempPassword!)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1600)
                    } catch {
                      window.prompt('Copy the password:', result.tempPassword)
                    }
                  }}
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Share this securely. It won&apos;t be shown again — the user can also reset it via
                &ldquo;Forgot password.&rdquo;
              </p>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button size="sm" onClick={done}>
              Done
            </Button>
          </div>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit} className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-display text-lg font-black">Add user</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-panel-elevated px-2 py-0.5 text-sm font-bold hover:bg-panel"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Email *">
            <Input name="email" type="email" required placeholder="athlete@example.com" />
          </Field>
          <Field label="Full name">
            <Input name="display_name" placeholder="Jordan Rivers" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                name="user_type"
                defaultValue="talent"
                className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
              >
                <option value="talent">Talent</option>
                <option value="brand">Brand</option>
              </select>
            </Field>
            <Field label="Password">
              <Input name="password" type="text" placeholder="Blank = auto-generate" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="make_admin" className="h-4 w-4 accent-primary" />
            Grant admin access
          </label>
        </div>
        {result && !result.ok && (
          <p className="mt-3 rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {result.message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button size="sm" variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create user'}
          </Button>
        </div>
      </form>
    </Overlay>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[var(--radius)] bg-background shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function UserRow({ user }: { user: Row }) {
  const [isPending, startTransition] = useTransition()
  const isAdmin = user.roles.includes('admin')
  const isSuspended = user.banned_until && new Date(user.banned_until).getTime() > Date.now()
  const isUnconfirmed = !user.email_confirmed_at

  const confirm_ = () => {
    if (!confirm(`Manually confirm ${user.email}? They'll be able to sign in immediately.`)) return
    const fd = new FormData()
    fd.set('user_id', user.id)
    startTransition(async () => {
      await confirmUser(fd)
    })
  }

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
          {isUnconfirmed && (
            <span className="text-display rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
              unconfirmed
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
        {isUnconfirmed && (
          <Button
            size="sm"
            variant="ghost"
            onClick={confirm_}
            disabled={isPending}
            className="text-xs text-success"
          >
            Confirm
          </Button>
        )}
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
