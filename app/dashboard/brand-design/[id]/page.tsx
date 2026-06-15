import Link from 'next/link'
import Image from 'next/image'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { refineRound } from '@/app/dashboard/brand-design/actions'
import { AssembleKitButton } from './assemble-kit'
import { AddonsSection } from './addons-section'
import { ArsenalGrid } from './arsenal-grid'
import { PreferencesForm } from './preferences-form'
import { GenerateConceptsButton } from './generate-form'
import { ConceptsGrid } from './concepts-grid'
import { RequestRevisionButton } from './revision-button'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string; tab?: string }>
}

type TopView = 'studio' | 'arsenal' | 'print'
type StudioTab = 'concepts' | 'final' | 'modify' | 'guide' | 'info' | 'help'

const TOP_VIEWS: Array<{ id: TopView; label: string; icon: string }> = [
  { id: 'studio', label: 'Design Studio', icon: '🎨' },
  { id: 'arsenal', label: 'Brand Arsenal', icon: '🎯' },
  { id: 'print', label: 'Print Shop', icon: '🛒' },
]

const STUDIO_TABS: Array<{ id: StudioTab; label: string; icon: string }> = [
  { id: 'concepts', label: 'Design Concepts', icon: '✏️' },
  { id: 'final', label: 'Final Logo', icon: '✅' },
  { id: 'modify', label: 'Modify Logo', icon: '✏️' },
  { id: 'guide', label: 'Brand Guide', icon: '🎯' },
  { id: 'info', label: 'My Info', icon: '👤' },
  { id: 'help', label: 'Help', icon: '❓' },
]

export const metadata = { title: 'Brand Design Studio' }

export default async function BrandDesignStudioPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const view: TopView = (sp.view as TopView) || 'studio'
  const tab: StudioTab = (sp.tab as StudioTab) || 'concepts'
  const user = await requireUser()
  const supabase = await createClient()

  const { data: brand } = await supabase
    .from('brand_designs')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!brand || brand.user_id !== user.id) return <MissingBrandState />

  const { data: concepts } = await supabase
    .from('logo_concepts')
    .select('id, round, image_url, thumbnail_url, is_shortlisted, is_selected, created_at')
    .eq('brand_design_id', id)
    .order('round', { ascending: true })
    .order('created_at', { ascending: true })

  const conceptsByRound: Record<number, NonNullable<typeof concepts>> = {}
  for (const c of concepts ?? []) {
    if (!conceptsByRound[c.round]) conceptsByRound[c.round] = []
    conceptsByRound[c.round]!.push(c)
  }
  const currentRound = Math.max(1, ...Object.keys(conceptsByRound).map(Number))
  const shortlistedCurrentRound = (concepts ?? []).filter(
    (c) => c.is_shortlisted && c.round === currentRound
  ).length
  const selectedConcept = (concepts ?? []).find((c) => c.is_selected) ?? null
  const hasFinal = Boolean(selectedConcept)

  const { data: addonsData } = await supabase
    .from('brand_design_addons')
    .select('kind, url, metadata, created_at')
    .eq('brand_design_id', id)
  const addons = (addonsData ?? []).map((a) => ({
    kind: a.kind,
    url: a.url ?? null,
    metadata: (a.metadata as Record<string, unknown>) ?? {},
    created_at: a.created_at,
  }))

  // Load preferences from profile so the Brand Preferences panel seeds
  // from whatever the talent already entered.
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'brand_initials, brand_vibe, brand_bg_pref, brand_include_name, brand_include_initials, brand_include_jersey, brand_elements'
    )
    .eq('id', user.id)
    .maybeSingle()

  // Revisions: fetch any existing ones plus the configured prices so the
  // Final Logo card can offer the right CTA (free vs paid).
  const { count: revisionCount } = await supabase
    .from('brand_design_revisions')
    .select('id', { count: 'exact', head: true })
    .eq('brand_design_id', id)
  const { getBrandDesignExtras } = await import('@/lib/service-pricing')
  const bdExtras = await getBrandDesignExtras()
  const revisionPaidLabel = bdExtras.revision_price_cents
    ? `$${(bdExtras.revision_price_cents / 100).toFixed(0)}`
    : ''
  const firstRevisionIsFree =
    bdExtras.first_revision_free && (revisionCount ?? 0) === 0

  const prefsInitial = {
    brand_name: brand.brand_name,
    initials: profile?.brand_initials ?? null,
    sport: brand.sport,
    athletic_position: brand.athletic_position,
    school: brand.school,
    jersey_number: brand.jersey_number,
    primary_color: brand.primary_color,
    secondary_color: brand.secondary_color,
    vibe: profile?.brand_vibe ?? brand.style_seed ?? 'Bold',
    bg_pref: profile?.brand_bg_pref ?? 'variety',
    include_name: profile?.brand_include_name ?? true,
    include_initials: profile?.brand_include_initials ?? false,
    include_jersey: profile?.brand_include_jersey ?? false,
    elements: profile?.brand_elements ?? null,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
              {brand.sport ?? 'Sport TBD'} · <span className="capitalize">{brand.status}</span>
              {!hasFinal && ` · Round ${currentRound} of 3`}
            </p>
          </div>
        </div>
      </div>

      {/* Top-level tabs */}
      <nav className="grid grid-cols-3 gap-2 rounded-[var(--radius)] border border-border bg-panel/40 p-2">
        {TOP_VIEWS.map((v) => {
          const active = v.id === view
          const locked = v.id !== 'studio' && !hasFinal
          if (locked) {
            return (
              <span
                key={v.id}
                title="Pick a final logo first"
                className="text-display flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/60"
              >
                <span aria-hidden>🔒</span> {v.label}
              </span>
            )
          }
          return (
            <Link
              key={v.id}
              href={`/dashboard/brand-design/${brand.id}?view=${v.id}`}
              className={`text-display flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                active
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span aria-hidden>{v.icon}</span> {v.label}
            </Link>
          )
        })}
      </nav>

      {/* Cross-promo banner when a final is set — matches the legacy "Your logo
          and brand guide can be found in your Design Studio…" copy. */}
      {hasFinal && view === 'studio' && (
        <div className="rounded-[var(--radius)] border border-success/30 bg-success/5 p-4 text-sm">
          🎉 Your logo and brand guide live here in <strong>Design Studio</strong>. Head over to{' '}
          <Link
            href={`/dashboard/brand-design/${brand.id}?view=arsenal`}
            className="font-bold text-accent hover:underline"
          >
            Brand Arsenal
          </Link>{' '}
          to create branded content, social avatars, and more. And don&rsquo;t miss the{' '}
          <Link
            href={`/dashboard/brand-design/${brand.id}?view=print`}
            className="font-bold text-accent hover:underline"
          >
            Print Shop
          </Link>{' '}
          for custom merch and gear.
        </div>
      )}

      {view === 'studio' && (
        <StudioView
          brand={brand}
          tab={tab}
          concepts={concepts ?? []}
          conceptsByRound={conceptsByRound}
          currentRound={currentRound}
          shortlistedCurrentRound={shortlistedCurrentRound}
          selectedConcept={selectedConcept}
          hasFinal={hasFinal}
          prefsInitial={prefsInitial}
          revisionCount={revisionCount ?? 0}
          revisionPaidLabel={revisionPaidLabel}
          firstRevisionIsFree={firstRevisionIsFree}
        />
      )}

      {view === 'arsenal' && (
        <ArsenalView
          brandId={brand.id}
          hasFinal={hasFinal}
          assetsUsed={brand.asset_credits_used ?? 0}
          assetsTotal={brand.asset_credits_total ?? 10}
          existingAddons={addons}
        />
      )}

      {view === 'print' && <PrintShopView brandId={brand.id} primary={brand.primary_color} />}
    </div>
  )
}

// ── Design Studio ───────────────────────────────────────────────────────────

function StudioView({
  brand,
  tab,
  concepts,
  conceptsByRound,
  currentRound,
  shortlistedCurrentRound,
  selectedConcept,
  hasFinal,
  prefsInitial,
  revisionCount,
  revisionPaidLabel,
  firstRevisionIsFree,
}: {
  brand: any
  tab: StudioTab
  concepts: any[]
  conceptsByRound: Record<number, any[]>
  currentRound: number
  shortlistedCurrentRound: number
  selectedConcept: any
  hasFinal: boolean
  prefsInitial: any
  revisionCount: number
  revisionPaidLabel: string
  firstRevisionIsFree: boolean
}) {
  return (
    <div className="space-y-6">
      <nav className="-mx-1 flex flex-wrap gap-1 border-b border-border">
        {STUDIO_TABS.map((t) => {
          const active = t.id === tab
          return (
            <Link
              key={t.id}
              href={`/dashboard/brand-design/${brand.id}?view=studio&tab=${t.id}`}
              className={`text-display flex items-center gap-1.5 rounded-t-[var(--radius-sm)] px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                active
                  ? 'border-b-2 border-primary bg-panel/40 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span aria-hidden>{t.icon}</span> {t.label}
            </Link>
          )
        })}
      </nav>

      {tab === 'concepts' && (
        <ConceptsTab
          brandId={brand.id}
          concepts={concepts}
          conceptsByRound={conceptsByRound}
          currentRound={currentRound}
          shortlistedCurrentRound={shortlistedCurrentRound}
          prefsInitial={prefsInitial}
        />
      )}
      {tab === 'final' && (
        <FinalLogoTab
          brand={brand}
          selectedConcept={selectedConcept}
          revisionCount={revisionCount}
          revisionPaidLabel={revisionPaidLabel}
          firstRevisionIsFree={firstRevisionIsFree}
        />
      )}
      {tab === 'modify' && (
        <ModifyLogoTab brandId={brand.id} hasFinal={hasFinal} />
      )}
      {tab === 'guide' && <BrandGuideTab brand={brand} hasFinal={hasFinal} />}
      {tab === 'info' && (
        <InfoTab
          brand={brand}
        />
      )}
      {tab === 'help' && <HelpTab />}
    </div>
  )
}

function ConceptsTab({
  brandId,
  concepts,
  conceptsByRound,
  currentRound,
  shortlistedCurrentRound,
  prefsInitial,
}: {
  brandId: string
  concepts: any[]
  conceptsByRound: Record<number, any[]>
  currentRound: number
  shortlistedCurrentRound: number
  prefsInitial: any
}) {
  return (
    <div className="space-y-6">
      <PreferencesForm brandId={brandId} initial={prefsInitial} />

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-eyebrow text-primary">Design Concepts</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {concepts.length === 0
              ? 'Save your preferences above, then kick off Round 1 — our designer creates 10 logo concepts using your settings.'
              : 'Tap ♡ to shortlist favorites, then refine for the next round.'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {concepts.length === 0 ? (
            <GenerateConceptsButton
              brandId={brandId}
              round={1}
              count={10}
              label="Generate 10 concepts"
            />
          ) : (
            <>
              <GenerateConceptsButton
                brandId={brandId}
                round={currentRound}
                count={10}
                label="+ 10 more"
                variant="outline"
                size="sm"
              />
              {currentRound < 3 && (
                <form
                  action={async () => {
                    'use server'
                    await refineRound(brandId)
                  }}
                >
                  <Button type="submit" size="sm" disabled={shortlistedCurrentRound === 0}>
                    {shortlistedCurrentRound > 0
                      ? `Refine ${shortlistedCurrentRound} → Round ${currentRound + 1}`
                      : 'Shortlist your favorites'}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {Object.keys(conceptsByRound)
        .map(Number)
        .sort((a, b) => a - b)
        .map((round) => {
          const list = conceptsByRound[round] ?? []
          const shortlistedInRound = list.filter((c) => c.is_shortlisted).length
          return (
            <section key={round}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
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
              <ConceptsGrid
                concepts={list}
                canSelect={true}
              />
            </section>
          )
        })}

      {concepts.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No concepts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click <strong>Generate 10 concepts</strong> above to kick off Round 1. Our designer
              uses your brand colors as the palette seed. If nothing happens after clicking, our
              designer may be briefly offline — try again in a moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FinalLogoTab({
  brand,
  selectedConcept,
  revisionCount,
  revisionPaidLabel,
  firstRevisionIsFree,
}: {
  brand: any
  selectedConcept: any
  revisionCount: number
  revisionPaidLabel: string
  firstRevisionIsFree: boolean
}) {
  if (!selectedConcept) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No final logo yet</CardTitle>
          <CardDescription>
            Generate concepts, shortlist your favorites, refine to Round 3, then select your
            final logo. It&rsquo;ll appear here with download options and your brand kit.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius)] border border-success/40 bg-success/5 p-5">
        <p className="text-eyebrow text-success">Final logo selected</p>
        <div className="mt-3 flex flex-wrap items-center gap-5">
          <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
            <Image
              src={selectedConcept.image_url}
              alt="Selected logo"
              width={160}
              height={160}
              className="aspect-square w-40 object-contain"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-display text-base font-bold">
              Round {selectedConcept.round} concept chosen
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              We extracted colors from your logo and auto-assembled your brand kit. Edit colors
              in <strong>My Info</strong> if you want a different reading.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: 'Primary', hex: brand.primary_color },
                { label: 'Secondary', hex: brand.secondary_color },
                { label: 'Accent', hex: (brand as { accent_color?: string | null }).accent_color },
                { label: 'Neutral', hex: (brand as { neutral_color?: string | null }).neutral_color },
              ]
                .filter((c): c is { label: string; hex: string } => Boolean(c.hex))
                .map((c) => (
                  <span
                    key={c.label}
                    className="text-display flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-sm border border-border"
                      style={{ background: c.hex }}
                    />
                    {c.label} · <span className="font-mono">{c.hex}</span>
                  </span>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <AssembleKitButton brandId={brand.id} existingKitUrl={brand.brand_kit_url ?? null} />
              <RequestRevisionButton
                brandId={brand.id}
                paidPriceLabel={revisionPaidLabel}
                firstIsFree={firstRevisionIsFree}
                existingCount={revisionCount}
              />
            </div>
          </div>
          <a
            href={selectedConcept.image_url}
            download
            className="text-display self-start rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-panel"
          >
            ⬇ Download PNG
          </a>
        </div>
      </section>
      <p className="text-xs text-muted-foreground">
        All file formats (PNGs, transparent, JPG, SVG, brand guide, social avatars) ship in the
        brand kit ZIP. Build one with the button above.
      </p>
    </div>
  )
}

function ModifyLogoTab({ brandId, hasFinal }: { brandId: string; hasFinal: boolean }) {
  if (!hasFinal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Locked until final logo</CardTitle>
          <CardDescription>
            Once you select a final logo, you can open the canvas editor to add text, color
            variants, taglines, or alternate compositions.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Canvas editor</CardTitle>
        <CardDescription>
          Add text, swap colors, position the logo, and export a new version.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={`/dashboard/brand-design/${brandId}/canvas`}
          className="text-display inline-block rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
        >
          Open canvas editor →
        </Link>
      </CardContent>
    </Card>
  )
}

function BrandGuideTab({ brand, hasFinal }: { brand: any; hasFinal: boolean }) {
  if (!hasFinal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand guide unlocks with your final logo</CardTitle>
          <CardDescription>
            The guide includes colors, font pair, logo usage rules, and brand voice — generated
            from your selected logo.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  const swatches = [
    { label: 'Primary', hex: brand.primary_color },
    { label: 'Secondary', hex: brand.secondary_color },
    { label: 'Accent', hex: brand.accent_color },
    { label: 'Neutral', hex: brand.neutral_color },
  ].filter((s) => Boolean(s.hex))
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription>Your extracted brand palette.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {swatches.map((s) => (
              <div
                key={s.label}
                className="overflow-hidden rounded-[var(--radius-sm)] border border-border"
              >
                <div className="h-24" style={{ background: s.hex }} />
                <div className="bg-background p-3">
                  <p className="text-display text-xs font-bold uppercase tracking-widest">
                    {s.label}
                  </p>
                  <p className="mt-0.5 font-mono text-sm">{s.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <KitFileGrid
        files={Array.isArray(brand.kit_files) ? brand.kit_files : []}
        kitUrl={brand.brand_kit_url ?? null}
      />
    </div>
  )
}

interface KitFile {
  name: string
  label: string
  mimeType: string
  shortMeta: string
  url: string
}

function KitFileGrid({ files, kitUrl }: { files: KitFile[]; kitUrl: string | null }) {
  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand kit assembling…</CardTitle>
          <CardDescription>
            Your downloadable files appear here once the kit finishes. If they don&rsquo;t
            show up, click <strong>Rebuild kit</strong> on the Final Logo tab.
          </CardDescription>
        </CardHeader>
        {kitUrl && (
          <CardContent>
            <a
              href={kitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-display inline-block rounded-[var(--radius-sm)] bg-success/20 border border-success/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-success"
            >
              ⬇ Download brand kit ZIP
            </a>
          </CardContent>
        )}
      </Card>
    )
  }
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Brand assets</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Every file in your brand kit. Download individually, or grab the full ZIP for a
            collaborator.
          </p>
        </div>
        {kitUrl && (
          <a
            href={kitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-display rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-success"
          >
            ⬇ Download full ZIP
          </a>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {files.map((f) => (
          <KitFileCard key={f.name} file={f} />
        ))}
      </div>
    </section>
  )
}

function KitFileCard({ file }: { file: KitFile }) {
  const isImage = file.mimeType.startsWith('image/')
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
      <div className="flex aspect-[4/3] items-center justify-center bg-panel-elevated">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.label}
            className="max-h-full max-w-full object-contain"
            style={{
              background:
                file.name.includes('on-black') || file.name.includes('-black')
                  ? '#000'
                  : '#fff',
            }}
          />
        ) : (
          <span className="text-display text-4xl text-muted-foreground">📄</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-display text-sm font-bold">{file.label}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          {file.shortMeta}
        </p>
        <a
          href={file.url}
          download={file.name}
          className="text-display mt-3 inline-block rounded-[var(--radius-sm)] bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
        >
          ⬇ Download
        </a>
      </div>
    </div>
  )
}

function InfoTab({ brand }: { brand: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account snapshot</CardTitle>
        <CardDescription>
          Edit your full brand preferences on the <strong>Design Concepts</strong> tab — that&rsquo;s
          where everything saves and where new concepts get generated from.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <Snapshot label="Brand name" value={brand.brand_name} />
          <Snapshot label="Sport" value={brand.sport} />
          <Snapshot label="Position" value={brand.athletic_position} />
          <Snapshot label="School" value={brand.school} />
          <Snapshot label="Jersey #" value={brand.jersey_number} />
          <Snapshot label="Status" value={brand.status} />
        </div>
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          Asset credits: {brand.asset_credits_used ?? 0} / {brand.asset_credits_total ?? 10}
          {' · '}
          Concept batches used: {brand.logo_concept_credits ?? 0}
        </p>
      </CardContent>
    </Card>
  )
}

function Snapshot({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value ?? '—'}</p>
    </div>
  )
}

function HelpTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Round 1</strong> — our designer creates 10 logo
            concepts from your brand basics + colors. Shortlist your favorites with ♡.
          </p>
          <p>
            <strong className="text-foreground">Round 2</strong> — Click <em>Refine</em>. Each
            shortlisted concept gets 3 variations exploring nearby aesthetics.
          </p>
          <p>
            <strong className="text-foreground">Round 3</strong> — Tighten further. Pick the
            single concept that becomes your final logo.
          </p>
          <p>
            Once final, we extract dominant colors from the logo, generate a brand kit
            (transparent PNG, SVG, social avatars, brand guide PDF, font pair, more) and unlock
            the Brand Arsenal + Print Shop tabs.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stuck?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If <em>Generate</em> doesn&rsquo;t produce concepts, our designer may be briefly
            offline. Wait a moment and try again. If it keeps happening, ping support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Brand Arsenal ───────────────────────────────────────────────────────────

function ArsenalView({
  brandId,
  hasFinal,
  assetsUsed,
  assetsTotal,
  existingAddons,
}: {
  brandId: string
  hasFinal: boolean
  assetsUsed: number
  assetsTotal: number
  existingAddons: Array<{ kind: string; url: string | null; metadata: Record<string, unknown>; created_at: string }>
}) {
  const remaining = Math.max(0, assetsTotal - assetsUsed)
  const pct = assetsTotal > 0 ? Math.min(100, Math.round((assetsUsed / assetsTotal) * 100)) : 0
  if (!hasFinal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔒 Brand Arsenal unlocks with your final logo</CardTitle>
          <CardDescription>
            Once you have a final logo, you can generate social media templates, merch mockups,
            business cards, brand voice docs, and more — all branded with your logo and colors.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-accent">Brand Arsenal</p>
          <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
            Your brand toolkit
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and customize branded content with your logo and colors.
          </p>
        </div>
        <div className="min-w-[200px] rounded-[var(--radius-sm)] border border-border bg-panel/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Asset usage
            </span>
            <span className="text-display text-xs font-bold text-foreground">
              {assetsUsed} / {assetsTotal}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
            <div
              className="h-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{remaining} remaining</p>
        </div>
      </div>

      <ArsenalGrid brandId={brandId} hasFinal={hasFinal} />

      <div>
        <p className="text-eyebrow text-primary">Quick-generate add-ons</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Composited assets — logo animation, brand voice doc, QR code, social avatar pack,
          trading card. These ship instantly — no waiting.
        </p>
        <div className="mt-3">
          <AddonsSection brandId={brandId} hasSelected={hasFinal} existing={existingAddons} />
        </div>
      </div>
    </div>
  )
}

// ── Print Shop ──────────────────────────────────────────────────────────────

async function PrintShopView({
  brandId,
  primary,
}: {
  brandId: string
  primary: string | null
}) {
  const supabase = createServiceClient()
  const products = supabase
    ? (
        await supabase
          .from('print_products')
          .select('id, slug, name, description, category, cover_image_url, base_price_cents, lead_time_days')
          .eq('active', true)
          .order('position', { ascending: true })
          .order('name', { ascending: true })
      ).data ?? []
    : []
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow text-accent">Print Shop</p>
          <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
            Custom branded products
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Printed &amp; shipped to you — every product mock-up uses your logo and brand colors.
          </p>
        </div>
        <Link
          href="/dashboard/print-shop"
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
        >
          Full catalog ↗
        </Link>
      </div>
      {products.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Catalog empty</CardTitle>
            <CardDescription>
              Admins add products under <code className="font-mono">/dashboard/admin/print-shop</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 9).map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/print-shop/${p.slug}?brand=${brandId}`}
              className="group block overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40 transition hover:border-primary/40"
            >
              <div className="aspect-[4/3] bg-panel-elevated">
                {p.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <p className="text-eyebrow text-muted-foreground">{p.category.replace('_', ' ')}</p>
                <p className="text-display mt-1 font-bold">{p.name}</p>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-3 flex items-baseline justify-between">
                  <p
                    className="text-display text-lg font-black"
                    style={{ color: primary ?? undefined }}
                  >
                    from ${(p.base_price_cents / 100).toFixed(0)}
                  </p>
                  <span className="text-display rounded-[var(--radius-sm)] bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    Order now
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Building blocks ─────────────────────────────────────────────────────────

function MissingBrandState() {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/brand-design"
        className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← Brand Designs
      </Link>
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
        <p className="text-eyebrow text-accent">Brand design not found</p>
        <h1 className="text-display mt-2 text-2xl font-black tracking-tight">
          This brand design no longer exists
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The link you followed points to a brand design that was deleted or never finished
          creating. Your other brand designs are still here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard/brand-design">
            <Button size="sm">Back to your brand designs</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
