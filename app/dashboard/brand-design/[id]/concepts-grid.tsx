'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import {
  toggleShortlist,
  selectFinalConcept,
} from '@/app/dashboard/brand-design/actions'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

export interface ConceptRow {
  id: string
  round: number
  image_url: string
  thumbnail_url: string | null
  is_shortlisted: boolean
  is_selected: boolean
}

const MAX_COMPARE = 4

/**
 * Client wrapper around the concept grid — manages cross-tile compare
 * selection, the lightbox modal, finalize-confirmation, and the
 * "purchase another final" Stripe checkout for non-selected concepts
 * after one is already final.
 */
export function ConceptsGrid({
  concepts,
  canSelect,
  hasFinal,
  additionalPriceLabel,
}: {
  concepts: ConceptRow[]
  canSelect: boolean
  hasFinal: boolean
  additionalPriceLabel: string
}) {
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [compareOpen, setCompareOpen] = useState(false)
  const [lightboxId, setLightboxId] = useState<string | null>(null)

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_COMPARE) {
        next.add(id)
      }
      return next
    })
  }
  const clearCompare = () => setCompareIds(new Set())

  const lightboxConcept = lightboxId ? concepts.find((c) => c.id === lightboxId) ?? null : null
  const compareConcepts = concepts.filter((c) => compareIds.has(c.id))

  // Finalize confirmation — clicking 'Select as final' opens a modal asking
  // the talent to confirm. Once they confirm, the server action runs.
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const confirmConcept = confirmId ? concepts.find((c) => c.id === confirmId) ?? null : null

  // Purchase-additional-final flow — when a final already exists, clicking a
  // non-selected concept's CTA opens an embedded Stripe checkout to add it
  // as an additional final.
  const [purchaseClientSecret, setPurchaseClientSecret] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchasePending, startPurchase] = useTransition()
  const beginPurchaseFinal = (conceptId: string) => {
    setPurchaseError(null)
    startPurchase(async () => {
      try {
        const res = await fetch('/api/checkout/brand-design-extras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'additional_final', concept_id: conceptId }),
        })
        const json = (await res.json()) as { client_secret?: string; error?: string }
        if (!res.ok || !json.client_secret) {
          setPurchaseError(json.error ?? 'Could not start checkout.')
          return
        }
        setPurchaseClientSecret(json.client_secret)
      } catch {
        setPurchaseError('Could not start checkout.')
      }
    })
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {concepts.map((c) => (
          <ConceptTile
            key={c.id}
            concept={c}
            canSelect={canSelect}
            hasFinal={hasFinal}
            additionalPriceLabel={additionalPriceLabel}
            inCompare={compareIds.has(c.id)}
            compareFull={compareIds.size >= MAX_COMPARE && !compareIds.has(c.id)}
            onToggleCompare={() => toggleCompare(c.id)}
            onEnlarge={() => setLightboxId(c.id)}
            onSelectAsFinal={() => setConfirmId(c.id)}
            onPurchaseAsFinal={() => beginPurchaseFinal(c.id)}
            purchasePending={purchasePending}
          />
        ))}
      </div>

      {confirmConcept && (
        <ConfirmFinalModal
          concept={confirmConcept}
          onClose={() => setConfirmId(null)}
        />
      )}

      {purchaseClientSecret && (
        <PurchaseFinalModal
          clientSecret={purchaseClientSecret}
          onClose={() => setPurchaseClientSecret(null)}
        />
      )}

      {purchaseError && (
        <div className="fixed bottom-6 right-6 z-40 rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive shadow-elevated">
          {purchaseError}
          <button
            type="button"
            onClick={() => setPurchaseError(null)}
            className="ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {compareIds.size >= 2 && (
        <div className="sticky bottom-4 z-30 mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border border-primary/40 bg-background/95 px-4 py-2 shadow-elevated backdrop-blur">
          <span className="text-display text-xs font-bold uppercase tracking-widest">
            {compareIds.size} selected
          </span>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="text-display rounded-full bg-primary px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground"
          >
            Compare side-by-side
          </button>
          <button
            type="button"
            onClick={clearCompare}
            className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {compareOpen && (
        <CompareModal
          concepts={compareConcepts}
          onClose={() => setCompareOpen(false)}
        />
      )}
      {lightboxConcept && (
        <Lightbox concept={lightboxConcept} onClose={() => setLightboxId(null)} />
      )}
    </>
  )
}

function ConceptTile({
  concept,
  canSelect,
  inCompare,
  compareFull,
  hasFinal,
  additionalPriceLabel,
  onToggleCompare,
  onEnlarge,
  onSelectAsFinal,
  onPurchaseAsFinal,
  purchasePending,
}: {
  concept: ConceptRow
  canSelect: boolean
  inCompare: boolean
  compareFull: boolean
  hasFinal: boolean
  additionalPriceLabel: string
  onToggleCompare: () => void
  onEnlarge: () => void
  onSelectAsFinal: () => void
  onPurchaseAsFinal: () => void
  purchasePending: boolean
}) {
  const [pending, startTransition] = useTransition()

  const handleShortlist = () => {
    startTransition(async () => {
      await toggleShortlist(concept.id)
    })
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-[var(--radius-sm)] border bg-white ${
        concept.is_selected
          ? 'border-success ring-2 ring-success/40'
          : concept.is_shortlisted
            ? 'border-primary'
            : 'border-border'
      }`}
    >
      <button
        type="button"
        onClick={onEnlarge}
        className="block w-full"
        aria-label="Enlarge concept"
      >
        <Image
          src={concept.thumbnail_url ?? concept.image_url}
          alt={`Logo concept (round ${concept.round})`}
          width={256}
          height={256}
          className="aspect-square w-full bg-white object-contain"
          unoptimized
        />
      </button>

      {/* PREVIEW watermark — overlaid on every concept until selected as final. */}
      {!concept.is_selected && <WatermarkOverlay size="small" />}

      {/* Top-right: shortlist heart */}
      <button
        type="button"
        onClick={handleShortlist}
        disabled={pending}
        aria-label={concept.is_shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
        className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-lg backdrop-blur transition-colors ${
          concept.is_shortlisted
            ? 'bg-primary text-primary-foreground'
            : 'bg-background/80 text-foreground/70 hover:bg-primary/40 hover:text-primary-foreground'
        }`}
      >
        {concept.is_shortlisted ? '♥' : '♡'}
      </button>

      {/* Top-left: compare checkbox */}
      <label
        className={`absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full px-2 py-1 backdrop-blur transition-colors ${
          inCompare ? 'bg-accent/90 text-accent-foreground' : 'bg-background/80 text-foreground/80'
        } ${compareFull ? 'opacity-40' : 'cursor-pointer hover:bg-accent/60'}`}
        title={compareFull ? `Limit ${MAX_COMPARE} concepts` : 'Add to compare'}
      >
        <input
          type="checkbox"
          checked={inCompare}
          disabled={compareFull}
          onChange={onToggleCompare}
          className="h-3 w-3 cursor-pointer"
        />
        <span className="text-display text-[9px] font-bold uppercase tracking-widest">
          Compare
        </span>
      </label>

      {/* Bottom strip: enlarge + CTA */}
      <div className="absolute inset-x-2 bottom-2 z-10 flex items-center justify-between gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEnlarge}
          className="text-display rounded-full bg-background/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest backdrop-blur"
        >
          🔍 Enlarge
        </button>
        {!concept.is_selected && canSelect && !hasFinal && (
          <button
            type="button"
            onClick={onSelectAsFinal}
            className="text-display rounded-full bg-success/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-success-foreground hover:bg-success"
          >
            Select as final
          </button>
        )}
        {!concept.is_selected && hasFinal && (
          <button
            type="button"
            onClick={onPurchaseAsFinal}
            disabled={purchasePending}
            className="text-display rounded-full bg-accent/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-accent-foreground hover:bg-accent disabled:opacity-50"
          >
            {purchasePending
              ? 'Loading…'
              : additionalPriceLabel
                ? `Buy as final — ${additionalPriceLabel}`
                : 'Buy as final'}
          </button>
        )}
      </div>

      {concept.is_selected && (
        <div className="absolute right-2 bottom-2 z-10">
          <span className="text-display rounded-full bg-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success-foreground">
            ✓ Final
          </span>
        </div>
      )}
    </div>
  )
}

function ConfirmFinalModal({
  concept,
  onClose,
}: {
  concept: ConceptRow
  onClose: () => void
}) {
  const [pending, startConfirm] = useTransition()
  const [stage, setStage] = useState<'idle' | 'lock' | 'kit'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    if (pending) return
    setError(null)
    setStage('lock')
    // Color extraction + kit assembly typically takes 20-40s. Bump the
    // copy to "Building brand kit" after a few seconds so it's clear
    // why we're still working.
    const kitTimer = setTimeout(() => setStage('kit'), 3500)
    startConfirm(async () => {
      try {
        const fd = new FormData()
        fd.set('concept_id', concept.id)
        await selectFinalConcept(fd)
        clearTimeout(kitTimer)
        // Server action revalidates the page; the parent re-renders
        // with hasFinal=true and the modal naturally goes away when
        // we close it here.
        onClose()
      } catch (e) {
        clearTimeout(kitTimer)
        setStage('idle')
        setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={pending ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[var(--radius)] bg-background shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-display font-bold">
            {pending ? 'Setting up your brand…' : 'Confirm your final logo'}
          </p>
          {!pending && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full bg-panel-elevated px-2 py-0.5 text-sm font-bold hover:bg-panel"
            >
              ✕
            </button>
          )}
        </div>
        <div className="space-y-4 p-5">
          <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={concept.image_url}
              alt="Final logo preview"
              className={`mx-auto block max-h-[260px] w-auto object-contain p-4 transition-opacity ${
                pending ? 'opacity-30' : 'opacity-100'
              }`}
            />
            {pending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <BuildingKitOverlay stage={stage} />
              </div>
            )}
          </div>
          {!pending && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>This locks in your final logo. After confirming you can:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong className="text-foreground">Modify</strong> this logo in the canvas editor (text, color, layout tweaks).</li>
                <li><strong className="text-foreground">Generate your brand kit</strong> automatically (logo files, social sizes, brand guide).</li>
                <li><strong className="text-foreground">Use it everywhere</strong> — Arsenal, Print Shop, EPK, your site.</li>
              </ul>
              <p className="mt-2 rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-3 text-xs">
                You can&rsquo;t switch to a different concept for free later. To use another
                concept as a final, you&rsquo;ll purchase it as an additional final logo.
              </p>
              {error && (
                <p className="mt-2 rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
          {pending ? (
            <p className="text-center text-xs text-muted-foreground">
              This usually takes 20–60 seconds. Stay on this page.
            </p>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="text-display rounded-[var(--radius-sm)] bg-success px-4 py-2 text-xs font-bold uppercase tracking-widest text-success-foreground"
              >
                Confirm final logo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BuildingKitOverlay({ stage }: { stage: 'idle' | 'lock' | 'kit' }) {
  const label =
    stage === 'kit'
      ? 'Building your brand kit…'
      : 'Locking in your final logo…'
  const sub =
    stage === 'kit'
      ? 'Logo files · social sizes · brand guide · Drive backup'
      : 'Extracting colors and finalizing'
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-primary/40 bg-background/95 px-5 py-4 shadow-elevated">
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
        <span className="absolute inset-1 animate-spin rounded-full border-4 border-primary/80 border-t-transparent" />
      </div>
      <div className="text-center">
        <p className="text-display text-sm font-bold text-primary">{label}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}

function PurchaseFinalModal({
  clientSecret,
  onClose,
}: {
  clientSecret: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[var(--radius)] bg-background shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-display font-bold">Purchase additional final logo</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-panel-elevated px-2 py-0.5 text-sm font-bold hover:bg-panel"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">
          {stripePromise ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
            <p className="p-5 text-sm text-destructive">
              Payments not configured — check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function WatermarkOverlay({ size }: { size: 'small' | 'large' }) {
  const cls =
    size === 'small'
      ? 'text-[26px] tracking-[6px]'
      : 'text-[88px] tracking-[20px]'
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] flex select-none items-center justify-center"
    >
      <span
        className={`font-black text-black/15 ${cls}`}
        style={{
          transform: 'rotate(-30deg)',
          textShadow: '0 0 12px rgba(255,255,255,0.4)',
        }}
      >
        PREVIEW
      </span>
    </div>
  )
}

function Lightbox({
  concept,
  onClose,
}: {
  concept: ConceptRow
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-[var(--radius)] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 rounded-full bg-background/80 px-2.5 py-1 text-sm font-bold backdrop-blur hover:bg-background"
        >
          ✕
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={concept.image_url}
          alt="Concept"
          className="block max-h-[90vh] max-w-[90vw] object-contain"
        />
        {!concept.is_selected && <WatermarkOverlay size="large" />}
      </div>
    </div>
  )
}

function CompareModal({
  concepts,
  onClose,
}: {
  concepts: ConceptRow[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-[1200px] overflow-hidden rounded-[var(--radius)] border border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-eyebrow text-primary">Compare</p>
            <h3 className="text-display mt-1 text-xl font-black tracking-tight">
              {concepts.length} concepts side-by-side
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-panel-elevated px-3 py-1 text-sm font-bold hover:bg-panel"
          >
            ✕
          </button>
        </div>
        <div
          className={`grid gap-4 ${
            concepts.length === 2
              ? 'grid-cols-2'
              : concepts.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {concepts.map((c) => (
            <div
              key={c.id}
              className="relative overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image_url}
                alt={`Round ${c.round} concept`}
                className="aspect-square w-full bg-white object-contain"
              />
              {!c.is_selected && <WatermarkOverlay size="small" />}
              <div className="border-t border-border bg-background/95 p-2 text-center">
                <p className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Round {c.round}
                  {c.is_shortlisted && <span className="ml-2 text-primary">♥ Shortlisted</span>}
                  {c.is_selected && <span className="ml-2 text-success">✓ Final</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
