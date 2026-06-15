import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { LocalTime } from '@/components/ui/local-time'
import { BrandAdminTools } from './tools'

export const metadata = { title: 'Brand Design — Admin' }

export default async function AdminBrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) notFound()

  const { data: brand } = await supabase
    .from('brand_designs')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!brand) notFound()

  const [{ data: concepts }, { data: profile }, { data: userRes }] = await Promise.all([
    supabase
      .from('logo_concepts')
      .select('id, round, image_url, is_shortlisted, is_selected, created_at')
      .eq('brand_design_id', id)
      .order('round', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(60),
    supabase
      .from('profiles')
      .select('display_name, brand_tagline, brand_font_pair, avatar_url')
      .eq('id', brand.user_id)
      .maybeSingle(),
    supabase.auth.admin.getUserById(brand.user_id),
  ])
  const ownerEmail = userRes?.user?.email ?? null

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/brands"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← All brand designs
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-eyebrow text-accent">Brand · admin tools</p>
            <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
              {brand.brand_name ?? 'Untitled brand'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[profile?.display_name, ownerEmail].filter(Boolean).join(' · ') || brand.user_id}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Created <LocalTime value={brand.created_at} mode="datetime" /> · status{' '}
              <span className="text-foreground">{brand.status}</span>
              {brand.finalized_at && (
                <> · finalized <LocalTime value={brand.finalized_at} mode="datetime" /></>
              )}
            </p>
          </div>
          <a
            href={`/dashboard/admin/users/impersonate?user_id=${brand.user_id}&return=/dashboard/brand-design/${brand.id}`}
            className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary"
          >
            👁 View as user
          </a>
        </div>
      </div>

      {/* Snapshot */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
          <p className="text-eyebrow text-primary">Brand brief</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <Detail label="Sport" value={brand.sport} />
            <Detail label="Position" value={brand.athletic_position} />
            <Detail label="School" value={brand.school} />
            <Detail label="Jersey" value={brand.jersey_number} />
            <Detail label="Style seed" value={brand.style_seed} />
            <Detail label="Tagline" value={profile?.brand_tagline ?? null} />
            <ColorDetail label="Primary" value={brand.primary_color} />
            <ColorDetail label="Secondary" value={brand.secondary_color} />
            <ColorDetail label="Accent" value={brand.accent_color} />
            <ColorDetail label="Neutral" value={brand.neutral_color} />
          </dl>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
          <p className="text-eyebrow text-primary">Final logo</p>
          {brand.final_logo_url ? (
            <div className="mt-3 flex items-start gap-4">
              <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
                <Image
                  src={brand.final_logo_url}
                  alt=""
                  width={120}
                  height={120}
                  className="aspect-square w-30 object-contain"
                  unoptimized
                />
              </div>
              <div className="flex-1 space-y-2 text-xs">
                <a
                  href={brand.final_logo_url}
                  download
                  className="text-display block rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest"
                >
                  Download original PNG
                </a>
                {brand.brand_kit_url && (
                  <a
                    href={brand.brand_kit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-display block rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-primary"
                  >
                    Open brand kit ZIP
                  </a>
                )}
                {brand.admin_brand_guide_url && (
                  <a
                    href={brand.admin_brand_guide_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-display block rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest"
                  >
                    Admin brand guide
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No final selected. Talent can pick from concepts in the studio, or upload one
              from below.
            </p>
          )}
        </div>
      </section>

      {/* Concept gallery */}
      <section>
        <p className="text-eyebrow mb-3 text-primary">
          Generated concepts · {(concepts ?? []).length}
        </p>
        {(concepts ?? []).length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {(concepts ?? []).map((c) => (
              <a
                key={c.id}
                href={c.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative overflow-hidden rounded-[var(--radius-sm)] border ${
                  c.is_selected
                    ? 'border-success'
                    : c.is_shortlisted
                    ? 'border-accent'
                    : 'border-border'
                } bg-panel/40`}
              >
                <Image
                  src={c.image_url}
                  alt=""
                  width={200}
                  height={200}
                  className="aspect-square w-full object-contain bg-white"
                  unoptimized
                />
                <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white">
                  R{c.round}
                  {c.is_selected && ' · final'}
                  {!c.is_selected && c.is_shortlisted && ' · ❤'}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No concepts generated yet.
          </p>
        )}
      </section>

      {/* Admin tools */}
      <BrandAdminTools
        brandId={brand.id}
        existingNotes={brand.admin_notes ?? ''}
        adminConcepts={
          (brand.admin_concepts as Array<{ url: string; uploaded_at: string }> | null) ?? []
        }
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate">{value ?? '—'}</dd>
    </div>
  )
}

function ColorDetail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5">
        {value && (
          <span
            className="inline-block h-3 w-3 rounded-sm border border-border"
            style={{ background: value }}
          />
        )}
        <span className="font-mono">{value ?? '—'}</span>
      </dd>
    </div>
  )
}
