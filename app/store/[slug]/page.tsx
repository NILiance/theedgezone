import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StorefrontSections, type StorefrontProduct } from './storefront-sections'
import {
  normalizeSections,
  fontStack,
  googleFontsHref,
  type StoreTheme,
} from '@/lib/store-sections'

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
      'id, slug, name, tagline, description, hero_image_url, logo_url, primary_color, secondary_color, status, user_id, theme, sections'
    )
    .eq('slug', slug)
    .maybeSingle()
  if (!store) notFound()
  let isOwnerOrAdmin = false
  if (store.status !== 'open') {
    isOwnerOrAdmin = await viewerCanPreview(supabase, store.user_id)
    if (!isOwnerOrAdmin) notFound()
  }
  const isPreview = store.status !== 'open' && (preview === '1' || isOwnerOrAdmin)

  const { data: products } = await supabase
    .from('store_products')
    .select(
      'id, slug, name, description, price_cents, compare_at_cents, currency, primary_image_url, inventory, variants'
    )
    .eq('store_id', store.id)
    .eq('active', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  const theme = ((store as { theme?: unknown }).theme ?? {}) as StoreTheme
  let sections = normalizeSections((store as { sections?: unknown }).sections)
  // Always surface the catalog unless the talent already placed a products or
  // featured section.
  if (!sections.some((s) => s.type === 'products' || s.type === 'featured')) {
    sections = [...sections, { id: '_products', type: 'products' }]
  }
  const headingStack = fontStack(theme.heading_font)
  const bodyStack = fontStack(theme.body_font)
  const fontsHref = googleFontsHref(theme)
  const storeLite = {
    id: store.id,
    primary_color: store.primary_color,
    secondary_color: store.secondary_color,
  }

  return (
    <main
      className="nilstore min-h-screen"
      style={{ background: store.secondary_color, fontFamily: bodyStack }}
    >
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}
      <style>{`.nilstore h1,.nilstore h2,.nilstore h3{font-family:${headingStack};}`}</style>
      {isPreview && (
        <div className="bg-accent text-accent-foreground px-4 py-2 text-center text-xs font-bold uppercase tracking-widest">
          Preview · {store.status} · not visible to the public
        </div>
      )}
      <section className="relative px-6 py-16 text-center" style={{ color: '#fff' }}>
        {store.hero_image_url && (
          <Image src={store.hero_image_url} alt="" fill className="object-cover opacity-30" unoptimized />
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
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl" style={{ color: '#fff' }}>
            {store.name}
          </h1>
          {store.tagline && (
            <p className="mt-4 text-lg" style={{ color: store.primary_color }}>
              {store.tagline}
            </p>
          )}
        </div>
      </section>

      <StorefrontSections
        sections={sections}
        store={storeLite}
        products={(products ?? []) as StorefrontProduct[]}
      />

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
