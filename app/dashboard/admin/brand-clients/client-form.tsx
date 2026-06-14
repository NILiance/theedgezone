'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertBrandClient } from './actions'

interface Values {
  id?: string
  name?: string
  contact_email?: string
  company?: string
  notes?: string
  status?: 'active' | 'archived'
}

export function ClientForm({ initial, isEdit }: { initial: Values; isEdit: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      const res = await upsertBrandClient(fd)
      if (res.ok) {
        router.push(`/dashboard/admin/brand-clients/${res.client_id}`)
        router.refresh()
      } else {
        setError(res.message ?? 'Save failed')
      }
    })
  }

  return (
    <form action={action} className="space-y-4">
      {initial.id && <input type="hidden" name="client_id" value={initial.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={initial.name} required />
        </div>
        <div>
          <Label htmlFor="contact_email">Email</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={initial.contact_email}
            required
          />
        </div>
        <div>
          <Label htmlFor="company">Company (optional)</Label>
          <Input id="company" name="company" defaultValue={initial.company ?? ''} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={initial.status ?? 'active'}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Internal notes (admin-only)</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={initial.notes ?? ''}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save client' : 'Add client'}
        </Button>
      </div>
    </form>
  )
}
