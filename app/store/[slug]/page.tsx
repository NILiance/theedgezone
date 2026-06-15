import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StoreCheckoutButton } from './checkout-button'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

async function viewerCanPreview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerUserId: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  if (user.id === ownerUserId) return true
  const { data: adminRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()
  return Boolean(adminRow)
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('name, tagline, description')
    .eq('slug', slug)
    .eq('status', 'open')
    .maybeSingle()
  if (!store) return { title: 'Shop' }
  return {
    title: store.name,
    description: store.tagline ?? store.description ?? undefined,
  }
}

export default async function PublicStorePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { preview } = await searchParams
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select(
      'id, slug, name, tagline, description, hero_image_url, logo_url, primary_color, secondary_color, status, user_id'
    )
    .eq('slug', slug)
    .maybeSingle()
  if (!store) notFound()
  if (store.status !== 'open') {
    if (preview !== '1' || !(await viewerCanPreview(supabase, store.user_id))) {
      notFound()
    }
  }
  const isPreview = preview === '1' && store.status !== 'open'

  const { data: products } = await supabase
    .from('store_products')
    .select(
      'id, slug, name, description, price_cents, compare_at_cents, currency, primary_image_url, inventory'
    )
    .eq('store_id', store.id)
    .eq('active', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen" style={{ background: store.secondary_color }}>
      {isPreview && (
        <div className="bg-accent text-accent-foreground px-4 py-2 text-center text-xs font-bold uppercase tracking-widest">
          Preview · {store.status} · not visible to the public
        </div>
      )}
      <section
        className="relative px-6 py-16 text-center"
        style={{ color: '#fff' }}
      >
        {store.hero_image_url && (
          <Image
            src={store.hero_image_url}
            alt=""
            fill
            className="object-cover opacity-30"
            unoptimized
          />
        )}
        <div className="relative mx-auto max-w-3xl">
          {store.logo_url && (
            <Image
              src={store.logo_url}
              alt={store.name}
              width={120}
              height={120}
              className="mx-auto mb-6 h-24 w-auto object-contain"
              unoptimized
            />
          )}
          <h1
            className="text-display text-5xl font-black tracking-tight sm:text-6xl"
            style={{ color: '#fff' }}
          >
            {store.name}
          </h1>
          {store.tagline && (
            <p className="mt-4 text-lg" style={{ color: store.primary_color }}>
              {store.tagline}
            </p>
          )}
        </div>
      </section>

      <section
        className="px-6 py-16"
        style={{ background: '#fff', color: '#0a0a0a' }}
      >
        <div className="mx-auto max-w-6xl">
          {(products ?? []).length === 0 ? (
            <p className="rounded-md border border-neutral-200 px-6 py-12 text-center text-sm text-neutral-500">
              No products listed yet. Check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(products ?? []).map((p) => (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-md border border-neutral-200 bg-white"
                >
                  {p.primary_image_url ? (
                    <Image
                      src={p.primary_image_url}
                      alt={p.name}
                      width={600}
                      height={600}
                      className="aspect-square w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                      No image
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-baseline gap-2">
                      <p
                        className="text-xl font-black"
                        style={{ color: store.primary_color }}
                      >
                        ${(p.price_cents / 100).toFixed(2)}
                      </p>
                      {p.compare_at_cents && p.compare_at_cents > p.price_cents && (
                        <p className="text-sm text-neutral-500 line-through">
                          ${(p.compare_at_cents / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                    {typeof p.inventory === 'number' && p.inventory <= 0 ? (
                      <p className="mt-3 text-xs uppercase tracking-widest text-neutral-500">
                        Sold out
                      </p>
                    ) : (
                      <div className="mt-3">
                        <StoreCheckoutButton
                          storeId={store.id}
                          productId={p.id}
                          buttonColor={store.primary_color}
                          buttonText={store.secondary_color}
                        />
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer
        className="border-t border-neutral-200 px-6 py-6 text-center text-xs"
        style={{ background: '#fff', color: '#666' }}
      >
        Powered by{' '}
        <a href="https://theedgezone.com" style={{ color: store.primary_color }}>
          Edge Zone
        </a>
      </footer>
    </main>
  )
}
