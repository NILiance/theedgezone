import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrandDesign } from '@/app/dashboard/brand-design/actions'
import { BuildFromPicker } from '@/components/dashboard/build-from-picker'
import { getBrandDesignExtras } from '@/lib/service-pricing'
import { fulfillCheckoutSession } from '@/lib/checkout-fulfillment'
import { AdditionalBrandButton } from './additional-brand-button'

export const metadata = { title: 'Brand Design' }

interface PageProps {
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}

export default async function BrandDesignIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const user = await requireUser()

  // Synchronous fallback for the Stripe webhook when a bd_additional
  // purchase redirects here. Webhook is async; without this the new
  // brand_designs row hasn't landed yet and the talent sees a stale
  // list (the original brand only).
  if (sp.checkout === 'success' && sp.session_id) {
    await fulfillCheckoutSession(sp.session_id, user.id)
  }

  const supabase = await createClient()

  const { data: brands } = await supabase
    .from('brand_designs')
    .select(
      'id, brand_name, sport, status, created_at, asset_credits_used, asset_credits_total, final_logo_url'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fallback thumbnail when no final yet — pick the selected concept,
  // then the first concept. Keeps the card non-empty during design.
  const brandsNeedingFallback = (brands ?? [])
    .filter((b) => !b.final_logo_url)
    .map((b) => b.id)
  const fallbackById = new Map<string, string>()
  if (brandsNeedingFallback.length > 0) {
    const { data: concepts } = await supabase
      .from('logo_concepts')
      .select(
        'brand_design_id, image_url, thumbnail_url, is_selected, is_shortlisted, created_at'
      )
      .in('brand_design_id', brandsNeedingFallback)
      .order('is_selected', { ascending: false })
      .order('is_shortlisted', { ascending: false })
      .order('created_at', { ascending: true })
    for (const c of concepts ?? []) {
      const bid = c.brand_design_id as string
      if (fallbackById.has(bid)) continue
      const url = (c.thumbnail_url ?? c.image_url) as string | null
      if (url) fallbackById.set(bid, url)
    }
  }

  const hasBrand = (brands?.length ?? 0) > 0
  const extras = await getBrandDesignExtras()
  const additionalPriceLabel = extras.additional_brand_price_cents
    ? `$${(extras.additional_brand_price_cents / 100).toFixed(0)}`
    : ''

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <p className="text-eyebrow mt-3 text-accent">Brand Design</p>
          <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
            Your brands
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            20 concepts included per brand. Generate, shortlist, refine, polish — yours forever.
          </p>
        </div>
        {hasBrand ? (
          <AdditionalBrandButton priceLabel={additionalPriceLabel} />
        ) : (
          <BuildFromPicker
            action={createBrandDesign}
            what="Brand"
            profileSections={['name', 'sport', 'school', 'jersey number', 'brand colors']}
            triggerLabel="+ Start your brand"
          />
        )}
      </div>

      {(!brands || brands.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No brands yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <span className="text-display font-bold text-foreground">+ Start new brand</span> to
              generate your first 20 logo concepts. We&apos;ll pre-fill from your profile.
            </p>
          </CardContent>
        </Card>
      )}

      {brands && brands.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {brand.brand_name ?? 'Untitled brand'}
                  </CardTitle>
                  <span
                    className={`text-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      brand.status === 'delivered' || brand.status === 'completed'
                        ? 'bg-success/20 text-success'
                        : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {brand.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {brand.sport ?? 'No sport set'} ·{' '}
                  {new Date(brand.created_at).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {/* Final logo preview — shows the chosen logo on a white
                    tile so it reads against any color. Falls back to a
                    concept thumbnail during the design phase, then to a
                    placeholder if nothing exists yet. */}
                {(() => {
                  const thumbUrl = brand.final_logo_url ?? fallbackById.get(brand.id) ?? null
                  return (
                    <div className="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl}
                          alt={`${brand.brand_name ?? 'Brand'} preview`}
                          className="max-h-full max-w-full object-contain p-4"
                        />
                      ) : (
                        <span className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          No concepts yet
                        </span>
                      )}
                    </div>
                  )
                })()}
                <p className="text-xs text-muted-foreground">
                  Asset credits: {brand.asset_credits_used} / {brand.asset_credits_total}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/dashboard/brand-design/${brand.id}`}>
                    <Button size="sm">Open Studio</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
