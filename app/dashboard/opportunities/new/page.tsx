import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { OpportunityForm } from '../opportunity-form'

export const metadata = { title: 'Post opportunity' }

export default async function NewOpportunityPage() {
  await requireUser()
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/opportunities"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← My opportunities
        </Link>
        <h1 className="text-display mt-3 text-3xl font-black tracking-tight">
          Post an opportunity
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brand campaigns, NIL deals, partnerships, perks. Posted opportunities show up on the
          public Opportunities page and (if synced) on NILiance Marketplace.
        </p>
      </div>
      <OpportunityForm initial={{}} isEdit={false} />
    </div>
  )
}
