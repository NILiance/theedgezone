import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { OrderForm } from './order-form'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Print Product' }

export default async function PrintProductPage({ params }: PageProps) {
  const { slug } = await params
  const user = await requireUser()
  const supabase = createServiceClient()
  if (!supabase) notFound()
  const { data: product } = await supabase
    .from('print_products')
    .select('id, slug, name, description, category, cover_image_url, base_price_cents, variants, options, lead_time_days')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  if (!product) notFound()

  const variants = (product.variants as Array<{ label: string; price_cents: number }>) ?? []
  const options = (product.options as Array<{ key: string; label: string; values: string[] }>) ?? []

  // Latest finalized brand logo — the default for print proofs.
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('final_logo_url, admin_final_logo_url')
    .eq('user_id', user.id)
    .not('final_logo_url', 'is', null)
    .order('finalized_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  const brandLogoUrl =
    (brand as { admin_final_logo_url?: string | null; final_logo_url?: string | null } | null)
      ?.admin_final_logo_url ??
    (brand as { final_logo_url?: string | null } | null)?.final_logo_url ??
    ''

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/print-shop"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Print Shop
        </Link>
        <p className="text-eyebrow mt-3 text-accent">{product.category.replace('_', ' ')}</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">{product.name}</h1>
        {product.description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{product.description}</p>
        )}
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          Lead time {product.lead_time_days} business days
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
          <div className="aspect-square bg-panel-elevated">
            {product.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>
        <OrderForm
          productId={product.id}
          productName={product.name}
          basePriceCents={product.base_price_cents}
          variants={variants}
          options={options}
          coverUrl={product.cover_image_url ?? ''}
          brandLogoUrl={brandLogoUrl}
        />
      </div>
    </div>
  )
}
