import Image from 'next/image'
import { StoreCheckoutButton } from './checkout-button'
import type { StoreSection } from '@/lib/store-sections'

export interface StorefrontProduct {
  id: string
  slug: string
  name: string
  description: string | null
  price_cents: number
  compare_at_cents: number | null
  currency: string
  primary_image_url: string | null
  inventory: number | null
  variants: unknown
}

interface StoreLite {
  id: string
  primary_color: string
  secondary_color: string
}

function ProductCard({ p, store }: { p: StorefrontProduct; store: StoreLite }) {
  return (
    <article className="overflow-hidden rounded-md border border-neutral-200 bg-white">
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
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{p.description}</p>
        )}
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-xl font-black" style={{ color: store.primary_color }}>
            ${(p.price_cents / 100).toFixed(2)}
          </p>
          {p.compare_at_cents && p.compare_at_cents > p.price_cents && (
            <p className="text-sm text-neutral-500 line-through">
              ${(p.compare_at_cents / 100).toFixed(2)}
            </p>
          )}
        </div>
        {typeof p.inventory === 'number' && p.inventory <= 0 ? (
          <p className="mt-3 text-xs uppercase tracking-widest text-neutral-500">Sold out</p>
        ) : (
          <div className="mt-3">
            <StoreCheckoutButton
              storeId={store.id}
              productId={p.id}
              basePriceCents={p.price_cents}
              currency={p.currency}
              variants={
                Array.isArray(p.variants)
                  ? (p.variants as Array<{
                      size?: string
                      color?: string
                      sku?: string
                      price_cents?: number | null
                      inventory?: number | null
                    }>)
                  : []
              }
              buttonColor={store.primary_color}
              buttonText={store.secondary_color}
            />
          </div>
        )}
      </div>
    </article>
  )
}

function ProductGrid({ products, store }: { products: StorefrontProduct[]; store: StoreLite }) {
  if (products.length === 0) {
    return (
      <p className="rounded-md border border-neutral-200 px-6 py-12 text-center text-sm text-neutral-500">
        No products listed yet. Check back soon.
      </p>
    )
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} store={store} />
      ))}
    </div>
  )
}

function Section({
  s,
  store,
  products,
}: {
  s: StoreSection
  store: StoreLite
  products: StorefrontProduct[]
}) {
  const bg = s.bg || '#ffffff'
  const align = s.align ?? 'center'
  const textAlign = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
  const wrap = 'mx-auto max-w-6xl'

  switch (s.type) {
    case 'about':
      return (
        <section className="px-6 py-16" style={{ background: bg, color: '#0a0a0a' }}>
          <div className={`${wrap} ${textAlign}`}>
            {s.heading && <h2 className="text-3xl font-black tracking-tight">{s.heading}</h2>}
            {s.body && (
              <p className="mx-auto mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-neutral-700">
                {s.body}
              </p>
            )}
          </div>
        </section>
      )

    case 'featured': {
      const picks = (s.product_ids ?? [])
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is StorefrontProduct => Boolean(p))
      if (picks.length === 0) return null
      return (
        <section className="px-6 py-16" style={{ background: bg, color: '#0a0a0a' }}>
          <div className={wrap}>
            {s.heading && (
              <h2 className={`mb-8 text-3xl font-black tracking-tight ${textAlign}`}>{s.heading}</h2>
            )}
            <ProductGrid products={picks} store={store} />
          </div>
        </section>
      )
    }

    case 'gallery': {
      const imgs = (s.images ?? []).filter(Boolean)
      if (imgs.length === 0) return null
      return (
        <section className="px-6 py-16" style={{ background: bg }}>
          <div className={wrap}>
            {s.heading && (
              <h2 className={`mb-8 text-3xl font-black tracking-tight ${textAlign}`} style={{ color: '#0a0a0a' }}>
                {s.heading}
              </h2>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {imgs.map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  alt=""
                  width={600}
                  height={600}
                  className="aspect-square w-full rounded-md object-cover"
                  unoptimized
                />
              ))}
            </div>
          </div>
        </section>
      )
    }

    case 'banner':
      return (
        <section
          className="relative px-6 py-24 text-center"
          style={{ background: bg || store.primary_color }}
        >
          {s.image_url && (
            <Image src={s.image_url} alt="" fill className="object-cover opacity-40" unoptimized />
          )}
          <div className="relative mx-auto max-w-3xl text-white">
            {s.heading && <h2 className="text-4xl font-black tracking-tight">{s.heading}</h2>}
            {s.body && <p className="mt-3 text-lg">{s.body}</p>}
            {s.cta_text && s.cta_url && (
              <a
                href={s.cta_url}
                className="mt-6 inline-block rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest"
                style={{ background: store.primary_color, color: store.secondary_color }}
              >
                {s.cta_text}
              </a>
            )}
          </div>
        </section>
      )

    case 'testimonials': {
      const quotes = (s.quotes ?? []).filter((q) => q.text)
      if (quotes.length === 0) return null
      return (
        <section className="px-6 py-16" style={{ background: bg, color: '#0a0a0a' }}>
          <div className={wrap}>
            {s.heading && (
              <h2 className={`mb-8 text-3xl font-black tracking-tight ${textAlign}`}>{s.heading}</h2>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quotes.map((q, i) => (
                <blockquote key={i} className="rounded-md border border-neutral-200 bg-white p-5">
                  <p className="text-sm italic text-neutral-700">&ldquo;{q.text}&rdquo;</p>
                  {q.author && (
                    <cite className="mt-3 block text-xs font-bold uppercase tracking-widest not-italic text-neutral-500">
                      — {q.author}
                    </cite>
                  )}
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )
    }

    case 'products':
      return (
        <section className="px-6 py-16" style={{ background: bg, color: '#0a0a0a' }}>
          <div className={wrap}>
            {s.heading && (
              <h2 className={`mb-8 text-3xl font-black tracking-tight ${textAlign}`}>{s.heading}</h2>
            )}
            <ProductGrid products={products} store={store} />
          </div>
        </section>
      )

    case 'custom_html':
      if (!s.html) return null
      return (
        <section className="px-6 py-12" style={{ background: bg }}>
          <div
            className={`${wrap} prose max-w-3xl`}
            // Talent-authored content for their own storefront (parity with the
            // site builder's custom-HTML block).
            dangerouslySetInnerHTML={{ __html: s.html }}
          />
        </section>
      )

    default:
      return null
  }
}

export function StorefrontSections({
  sections,
  store,
  products,
}: {
  sections: StoreSection[]
  store: StoreLite
  products: StorefrontProduct[]
}) {
  return (
    <>
      {sections.map((s) => (
        <Section key={s.id} s={s} store={store} products={products} />
      ))}
    </>
  )
}
