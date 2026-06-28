import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LogoCanvas } from '@/components/brand-design/logo-canvas'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ src?: string; kind?: string; label?: string }>
}

export const metadata = { title: 'Canvas editor' }

export default async function BrandCanvasPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { src, kind, label } = await searchParams
  const editingAsset = Boolean(src)
  const user = await requireUser()
  const supabase = await createClient()

  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, user_id, brand_name, sport, athletic_position, school, jersey_number, primary_color, secondary_color, final_logo_url'
    )
    .eq('id', id)
    .single()

  if (!brand || brand.user_id !== user.id) notFound()
  if (!editingAsset && !brand.final_logo_url) {
    return (
      <div className="space-y-4">
        <Link
          href={`/dashboard/brand-design/${id}`}
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Back to studio
        </Link>
        <h1 className="text-display text-2xl font-black">Pick a final concept first</h1>
        <p className="text-sm text-muted-foreground">
          The canvas editor starts from your selected final logo. Head back to the studio,
          generate concepts, and mark one as final.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/brand-design/${id}`}
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Back to studio
        </Link>
        <h1 className="text-display mt-3 text-3xl font-black tracking-tight">
          {editingAsset ? `Edit ${label ?? 'asset'}` : 'Canvas editor'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {editingAsset
            ? 'Edit text, colors and your logo on this asset. Save back to Your Creations or download a PNG.'
            : 'Add jersey numbers, school, position. Drag text on the canvas. Save to your brand or download a high-res PNG.'}
        </p>
      </div>

      <LogoCanvas
        brandId={brand.id}
        logoUrl={brand.final_logo_url ?? src ?? ''}
        baseUrl={src}
        assetKind={kind}
        assetLabel={label}
        defaults={{
          brand_name: brand.brand_name,
          sport: brand.sport,
          athletic_position: brand.athletic_position,
          school: brand.school,
          jersey_number: brand.jersey_number,
          primary_color: brand.primary_color ?? '#000000',
          secondary_color: brand.secondary_color ?? '#666666',
        }}
      />
    </div>
  )
}
