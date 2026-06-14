'use client'

import { useTransition } from 'react'
import { togglePermission } from './actions'

interface Permission {
  role: string
  capability: string
  allowed: boolean
  description: string | null
}

interface Props {
  permissions: Permission[]
}

export function PermissionsClient({ permissions }: Props) {
  const grouped = new Map<string, Permission[]>()
  for (const p of permissions) {
    const list = grouped.get(p.role) ?? []
    list.push(p)
    grouped.set(p.role, list)
  }

  return (
    <div className="space-y-5">
      {Array.from(grouped.entries()).map(([role, perms]) => (
        <section
          key={role}
          className="rounded-[var(--radius)] border border-border bg-panel/40"
        >
          <p className="text-eyebrow border-b border-border px-5 py-3 text-primary">
            {role}
          </p>
          <ul className="divide-y divide-border">
            {perms.map((p) => (
              <PermissionRow key={`${role}:${p.capability}`} permission={p} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function PermissionRow({ permission }: { permission: Permission }) {
  const [isPending, startTransition] = useTransition()
  const toggle = () => {
    const fd = new FormData()
    fd.set('role', permission.role)
    fd.set('capability', permission.capability)
    fd.set('allowed', (!permission.allowed).toString())
    startTransition(async () => {
      await togglePermission(fd)
    })
  }
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-display text-sm font-bold">{permission.capability}</p>
        {permission.description && (
          <p className="text-xs text-muted-foreground">{permission.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={`text-display flex h-6 w-12 items-center rounded-full transition-colors ${
          permission.allowed ? 'bg-success/90' : 'bg-panel-elevated'
        }`}
        title={permission.allowed ? 'Allowed' : 'Blocked'}
      >
        <span
          className={`h-5 w-5 rounded-full bg-background shadow transition-transform ${
            permission.allowed ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </li>
  )
}
