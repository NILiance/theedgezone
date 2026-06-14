import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  generateConcepts,
  toggleShortlist,
  refineRound,
  selectFinalConcept,
} from '@/app/dashboard/brand-design/actions'
import { AssembleKitButton } from './assemble-kit'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Brand Design Studio' }

export default async function BrandDesignStudioPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()

  const { data: brand } = await supabase
    .from('brand_designs')
    .select('*')
    .eq('id', id)
    .single()

  if (!brand || brand.user_id !== user.id) notFound()

  const { data: concepts } = await supabase
    .from('logo_concepts')
    .select('id, round, image_url, thumbnail_url, is_shortlisted, is_selected, created_at')
    .eq('brand_design_id', id)
    .order('round', { ascending: true })
    .order('created_at', { ascending: true })

  const conceptsByRound: Record<number, typeof concepts> = {}
  for (const c of concepts ?? []) {
    if (!conceptsByRound[c.round]) conceptsByRound[c.round] = []
    conceptsByRound[c.round]!.push(c)
  }
  const currentRound = Math.max(1, ...Object.keys(conceptsByRound).map(Number))
  const shortlistedCurrentRound = (concepts ?? []).filter(
    (c) => c.is_shortlisted && c.round === currentRound
  ).length
  const selectedConcept = (concepts ?? []).find((c) => c.is_selected) ?? null

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/brand-design"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Brand Designs
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-accent">Brand Design Studio</p>
            <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
              {brand.brand_name ?? 'Untitled brand'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {brand.sport ?? 'Sport TBD'} ·{' '}
              <span className="capitalize">{brand.status}</span> · Round {currentRound} of 3
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!concepts || concepts.length === 0 ? (
              <form action={generateConcepts}>
                <input type="hidden" name="brand_id" value={brand.id} />
                <input type="hidden" name="round" value="1" />
                <input type="hidden" name="count" value="20" />
                <Button type="submit" size="lg">
                  Generate 20 concepts
                </Button>
              </form>
            ) : (
              <>
                <form action={generateConcepts}>
                  <input type="hidden" name="brand_id" value={brand.id} />
                  <input type="hidden" name="round" value={currentRound} />
                  <input type="hidden" name="count" value="10" />
                  <Button type="submit" size="sm" variant="outline">
                    + 10 more
                  </Button>
                </form>
                {currentRound < 3 && (
                  <form
                    action={async () => {
                      'use server'
                      await refineRound(brand.id)
                    }}
                  >
                    <Button type="submit" size="sm" disabled={shortlistedCurrentRound === 0}>
                      {shortlistedCurrentRound > 0
                        ? `Refine ${shortlistedCurrentRound} → Round ${currentRound + 1}`
                        : 'Shortlist your favorites to refine'}
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Brand basics card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand basics</CardTitle>
          <CardDescription>
            We pre-fill from your profile. Edit and regenerate if you want a different angle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Detail label="Brand name" value={brand.brand_name} />
            <Detail label="Sport" value={brand.sport} />
            <Detail label="Position" value={brand.athletic_position} />
            <Detail label="School" value={brand.school} />
            <Detail label="Jersey #" value={brand.jersey_number} />
            <Detail label="Style seed" value={brand.style_seed} />
            <ColorDetail label="Primary" value={brand.primary_color} />
            <ColorDetail label="Secondary" value={brand.secondary_color} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Asset credits: {brand.asset_credits_used} / {brand.asset_credits_total}
            {' · '}
            Concept batches used: {brand.logo_concept_credits}
          </p>
        </CardContent>
      </Card>

      {/* Selected logo banner */}
      {selectedConcept && (
        <section className="rounded-[var(--radius)] border border-success/40 bg-success/5 p-5">
          <p className="text-eyebrow text-success">Final logo selected</p>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
              <Image
                src={selectedConcept.image_url}
                alt="Selected logo"
                width={120}
                height={120}
                className="aspect-square w-30 object-contain"
                unoptimized
              />
            </div>
            <div className="flex-1">
              <p className="text-display text-base font-bold">
                Round {selectedConcept.round} concept chosen
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assemble the kit to get the logo on white + transparent + 6 social avatar sizes
                + color tokens, packaged in a ZIP.
              </p>
              <div className="mt-3">
                <AssembleKitButton brandId={brand.id} existingKitUrl={brand.brand_kit_url ?? null} />
              </div>
            </div>
            <a
              href={selectedConcept.image_url}
              download
              className="text-display self-start rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-panel"
            >
              Download original PNG
            </a>
          </div>
        </section>
      )}

      {/* Concept rounds */}
      {Object.keys(conceptsByRound)
        .map(Number)
        .sort((a, b) => a - b)
        .map((round) => {
          const list = conceptsByRound[round] ?? []
          const shortlistedInRound = list.filter((c) => c.is_shortlisted).length
          return (
            <section key={round}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-eyebrow text-primary">
                  Round {round} ·{' '}
                  <span className="text-muted-foreground">
                    {list.length} concept{list.length === 1 ? '' : 's'}
                  </span>
                  {shortlistedInRound > 0 && (
                    <span className="text-success"> · {shortlistedInRound} ❤</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {round === currentRound
                    ? round < 3
                      ? 'Tap ♡ to shortlist, then Refine →'
                      : 'Pick one as your final'
                    : 'Locked'}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((c) => (
                  <ConceptTile
                    key={c.id}
                    concept={c}
                    canSelect={round === currentRound && round === 3}
                  />
                ))}
              </div>
            </section>
          )
        })}

      {!concepts || concepts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No concepts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <strong>Generate 20 concepts</strong> above to kick off Round 1. We use Ideogram
              V3 with your brand colors as the palette seed.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value ?? '—'}</p>
    </div>
  )
}

function ColorDetail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-center gap-2">
        {value && (
          <span
            className="inline-block h-4 w-4 rounded-sm border border-border"
            style={{ background: value }}
          />
        )}
        <span className="text-foreground">{value ?? '—'}</span>
      </div>
    </div>
  )
}

function ConceptTile({
  concept,
  canSelect,
}: {
  concept: {
    id: string
    image_url: string
    thumbnail_url: string | null
    is_shortlisted: boolean
    is_selected: boolean
  }
  canSelect: boolean
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[var(--radius-sm)] border bg-panel ${
        concept.is_selected
          ? 'border-success ring-2 ring-success/40'
          : concept.is_shortlisted
            ? 'border-primary'
            : 'border-border'
      }`}
    >
      <Image
        src={concept.thumbnail_url ?? concept.image_url}
        alt="Logo concept"
        width={256}
        height={256}
        className="aspect-square w-full bg-white object-contain"
        unoptimized
      />
      <form
        action={async () => {
          'use server'
          await toggleShortlist(concept.id)
        }}
        className="absolute right-2 top-2"
      >
        <button
          type="submit"
          aria-label="Toggle shortlist"
          className={`flex h-8 w-8 items-center justify-center rounded-full text-lg backdrop-blur transition-colors ${
            concept.is_shortlisted
              ? 'bg-primary text-primary-foreground'
              : 'bg-background/80 text-foreground/70 hover:bg-primary/40 hover:text-primary-foreground'
          }`}
        >
          {concept.is_shortlisted ? '♥' : '♡'}
        </button>
      </form>

      {canSelect && !concept.is_selected && (
        <form action={selectFinalConcept} className="absolute inset-x-2 bottom-2">
          <input type="hidden" name="concept_id" value={concept.id} />
          <button
            type="submit"
            className="text-display w-full rounded-[var(--radius-sm)] bg-success/90 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-success-foreground opacity-0 transition-opacity hover:bg-success group-hover:opacity-100"
          >
            Select as final
          </button>
        </form>
      )}
      {concept.is_selected && (
        <div className="absolute left-2 top-2">
          <span className="text-display rounded-full bg-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success-foreground">
            ✓ Final
          </span>
        </div>
      )}
    </div>
  )
}
