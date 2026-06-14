import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { ClientForm } from '../client-form'
import { ClientDetail } from './client-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Brand client' }

export default async function BrandClientDetailPage({ params }: PageProps) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const [{ data: client }, { data: assets }, { data: tokens }] = await Promise.all([
    supabase.from('brand_clients').select('*').eq('id', id).single(),
    supabase
      .from('brand_client_assets')
      .select('id, kind, filename, url, size_bytes, description, created_at')
      .eq('brand_client_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('brand_client_tokens')
      .select('token, expires_at, consumed_at, created_at')
      .eq('brand_client_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])
  if (!client) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/brand-clients"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Brand clients
        </Link>
        <h1 className="text-display mt-3 text-3xl font-black tracking-tight">{client.name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{client.contact_email}</p>
      </div>

      <ClientDetail
        clientId={client.id}
        assets={
          (assets ?? []) as Array<{
            id: string
            kind: string
            filename: string
            url: string
            size_bytes: number | null
            description: string | null
            created_at: string
          }>
        }
        recentTokens={
          (tokens ?? []) as Array<{
            token: string
            expires_at: string
            consumed_at: string | null
            created_at: string
          }>
        }
      />

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow mb-3 text-primary">Edit client</p>
        <ClientForm
          initial={{
            id: client.id,
            name: client.name,
            contact_email: client.contact_email,
            company: client.company ?? '',
            notes: client.notes ?? '',
            status: client.status as 'active' | 'archived',
          }}
          isEdit
        />
      </section>
    </div>
  )
}
