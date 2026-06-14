import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { OpportunityForm } from '../opportunity-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Edit opportunity' }

export default async function EditOpportunityPage({ params }: PageProps) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('opportunities')
    .select(
      'id, title, description, category, audience, price_cents, currency, location, deadline_at, contact_email, external_url, status, posted_by, listing_uuid'
    )
    .eq('id', id)
    .single()

  if (!row || row.posted_by !== user.id) notFound()

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
          Edit opportunity
        </h1>
      </div>
      <OpportunityForm
        initial={{
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category ?? '',
          audience: row.audience,
          price_cents: row.price_cents,
          currency: row.currency,
          location: row.location ?? '',
          deadline_at: row.deadline_at ? row.deadline_at.slice(0, 10) : '',
          contact_email: row.contact_email ?? '',
          external_url: row.external_url ?? '',
          status: row.status,
          listing_uuid: row.listing_uuid,
        }}
        isEdit={true}
      />
    </div>
  )
}
