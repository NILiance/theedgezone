'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateOrderStatus, updateOrderNotes } from '../actions'

interface Props {
  orderId: string
  currentStatus: string
  currentNotes: string
}

const STATUSES = ['paid', 'ready', 'provisioning', 'cancelled', 'refunded', 'pending']

export function OrderActions({ orderId, currentStatus, currentNotes }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState(currentNotes)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const saveStatus = () => {
    setMsg(null)
    const fd = new FormData()
    fd.set('order_id', orderId)
    fd.set('status', status)
    startTransition(async () => {
      const res = await updateOrderStatus(fd)
      setMsg(res.ok ? 'Status updated.' : res.message ?? 'Failed')
    })
  }

  const saveNotes = () => {
    setMsg(null)
    const fd = new FormData()
    fd.set('order_id', orderId)
    fd.set('fulfillment_notes', notes)
    startTransition(async () => {
      const res = await updateOrderNotes(fd)
      setMsg(res.ok ? 'Notes saved.' : res.message ?? 'Failed')
    })
  }

  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <p className="text-eyebrow text-primary">Admin actions</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <Label htmlFor="order_status">Status</Label>
          <select
            id="order_status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button onClick={saveStatus} disabled={isPending || status === currentStatus}>
            {isPending ? 'Saving…' : 'Update status'}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="order_notes">Fulfillment notes (admin-only)</Label>
        <textarea
          id="order_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          placeholder="Shipping references, partner ticket links, anything the next admin needs to know…"
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            onClick={saveNotes}
            disabled={isPending || notes === currentNotes}
            variant="outline"
          >
            Save notes
          </Button>
        </div>
      </div>

      {msg && <p className="mt-3 text-xs text-success">{msg}</p>}
    </section>
  )
}
