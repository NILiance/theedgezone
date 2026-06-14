import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTicket } from '../actions'

export const metadata = { title: 'New ticket' }

const CATEGORIES = [
  ['general', 'General question'],
  ['billing', 'Billing'],
  ['technical', 'Technical issue'],
  ['brand-design', 'Brand Design'],
  ['site-builder', 'Site Builder'],
  ['epk', 'EPK'],
  ['other', 'Other'],
] as const

export default async function NewTicketPage() {
  await requireUser()
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/support"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Support
        </Link>
        <h1 className="text-display mt-3 text-3xl font-black tracking-tight">New ticket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Be specific — links, screenshots in URL form, exact steps. Saves a follow-up.
        </p>
      </div>

      <form action={createTicket} className="space-y-4">
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" required maxLength={200} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="normal"
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="body">What&apos;s happening?</Label>
          <textarea
            id="body"
            name="body"
            rows={10}
            required
            minLength={10}
            maxLength={8000}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm leading-relaxed"
            placeholder="Steps to reproduce, what you expected, what happened, links/screenshots…"
          />
        </div>
        <div className="flex gap-2 border-t border-border pt-4">
          <Button type="submit">Submit ticket</Button>
          <Link href="/dashboard/support">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
