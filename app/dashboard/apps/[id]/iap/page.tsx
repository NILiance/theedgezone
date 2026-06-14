import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { IapManager } from './manager'

export const metadata = { title: 'In-app purchases' }

export default async function IapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, name, user_id')
    .eq('id', id)
    .single()
  if (!app || app.user_id !== user.id) notFound()

  const { data: products } = await supabase
    .from('app_iap_products')
    .select('*')
    .eq('app_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/apps/${id}`}
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← {app.name}
        </Link>
        <p className="text-eyebrow mt-3 text-accent">In-app purchases</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">IAP catalog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Define purchasable items. Once your app is approved on the App Store / Play Store,
          you&apos;ll register matching SKUs in the store consoles and paste their IDs here.
        </p>
      </div>
      <IapManager appId={id} products={products ?? []} />
    </div>
  )
}
