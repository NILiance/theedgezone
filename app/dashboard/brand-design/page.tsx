import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrandDesign } from '@/app/dashboard/brand-design/actions'

export const metadata = { title: 'Brand Design' }

export default async function BrandDesignIndexPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: brands } = await supabase
    .from('brand_designs')
    .select('id, brand_name, sport, status, created_at, asset_credits_used, asset_credits_total')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

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
        <form action={createBrandDesign}>
          <Button type="submit" size="lg">
            + Start new brand
          </Button>
        </form>
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
                      brand.status === 'completed'
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
