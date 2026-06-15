import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { BusinessCardEditor } from './editor'

export const metadata = { title: 'Card editor' }

export default async function BusinessCardEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const { data: card } = await supabase
    .from('digital_business_cards')
    .select('*')
    .eq('id', id)
    .single()
  if (!card || card.user_id !== user.id) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/business-cards"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Cards
        </Link>
        <p className="text-eyebrow mt-3 text-accent">Card editor</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
          {card.display_name ?? card.slug}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">/card/{card.slug}</p>
      </div>
      <BusinessCardEditor card={card} />
    </div>
  )
}
