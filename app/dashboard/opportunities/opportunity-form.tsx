'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertOpportunity, closeOpportunity } from './actions'

export interface OpportunityFormValues {
  id?: string
  title?: string
  description?: string
  category?: string
  audience?: string
  price_cents?: number | null
  currency?: string
  location?: string
  deadline_at?: string
  contact_email?: string
  external_url?: string
  status?: string
  listing_uuid?: string | null
}

interface Props {
  initial: OpportunityFormValues
  isEdit: boolean
}

export function OpportunityForm({ initial, isEdit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [publishToST, setPublishToST] = useState(!isEdit)

  const action = (fd: FormData) => {
    setError(null)
    if (publishToST) fd.set('publish_to_sharetribe', 'on')
    startTransition(async () => {
      const res = await upsertOpportunity(fd)
      if (res.ok) {
        router.push('/dashboard/opportunities')
        router.refresh()
      } else {
        setError(res.message ?? 'Failed')
      }
    })
  }

  const close = () => {
    if (!initial.id) return
    if (!confirm('Close this opportunity? It will no longer appear publicly.')) return
    const fd = new FormData()
    fd.set('opportunity_id', initial.id)
    startTransition(async () => {
      const res = await closeOpportunity(fd)
      if (res.ok) {
        router.push('/dashboard/opportunities')
        router.refresh()
      } else {
        setError(res.message ?? 'Failed')
      }
    })
  }

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="opportunity_id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={initial.title ?? ''}
            required
            maxLength={180}
            placeholder="e.g. Game-day NIL deal — supplements brand"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={initial.description ?? ''}
            rows={6}
            required
            maxLength={8000}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm leading-relaxed"
            placeholder="What's the deal? Deliverables, dates, exclusivity, anything that helps a talent decide if it's a fit."
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={initial.category ?? ''}
            placeholder="apparel, supplements, fintech…"
          />
        </div>

        <div>
          <Label htmlFor="audience">Audience</Label>
          <select
            id="audience"
            name="audience"
            defaultValue={initial.audience ?? 'talent'}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="talent">For talent</option>
            <option value="brand">For brands</option>
            <option value="everyone">Open to all</option>
          </select>
        </div>

        <div>
          <Label htmlFor="price_cents">Pay-out / budget (cents)</Label>
          <Input
            id="price_cents"
            name="price_cents"
            type="number"
            defaultValue={initial.price_cents ?? ''}
            min={0}
          />
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={initial.currency ?? 'usd'}
            maxLength={8}
          />
        </div>

        <div>
          <Label htmlFor="location">Location (optional)</Label>
          <Input
            id="location"
            name="location"
            defaultValue={initial.location ?? ''}
            placeholder="Remote / Atlanta, GA / nationwide…"
          />
        </div>

        <div>
          <Label htmlFor="deadline_at">Deadline (optional)</Label>
          <Input
            id="deadline_at"
            name="deadline_at"
            type="date"
            defaultValue={initial.deadline_at ?? ''}
          />
        </div>

        <div>
          <Label htmlFor="contact_email">Contact email</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={initial.contact_email ?? ''}
          />
        </div>

        <div>
          <Label htmlFor="external_url">External URL (optional)</Label>
          <Input
            id="external_url"
            name="external_url"
            type="url"
            defaultValue={initial.external_url ?? ''}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-sm)] border border-border bg-panel/40 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={publishToST}
            onChange={(e) => setPublishToST(e.target.checked)}
            disabled={isEdit}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <div>
            <p className="text-sm font-bold">Also publish to NILiance Marketplace</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isEdit
                ? 'Already synced from NILiance — edits don\'t push back yet.'
                : 'Creates a Sharetribe Marketplace listing so talents outside the Edge Zone audience can find it. Requires Sharetribe credentials on the deploy.'}
            </p>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Post opportunity'}
        </Button>
        {isEdit && initial.status === 'published' && (
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Close opportunity
          </Button>
        )}
      </div>
    </form>
  )
}
