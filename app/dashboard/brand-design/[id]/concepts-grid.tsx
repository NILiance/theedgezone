'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import {
  toggleShortlist,
  selectFinalConcept,
} from '@/app/dashboard/brand-design/actions'

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
 * selection and the lightbox modal. Individual tiles call the existing
 * server actions (toggleShortlist, selectFinalConcept) directly; this
 * component just holds the UI state.
 */
export function ConceptsGrid({
  concepts,
  canSelect,
}: {
  concepts: ConceptRow[]
  canSelect: boolean
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

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {concepts.map((c) => (
          <ConceptTile
            key={c.id}
            concept={c}
            canSelect={canSelect}
            inCompare={compareIds.has(c.id)}
            compareFull={compareIds.size >= MAX_COMPARE && !compareIds.has(c.id)}
            onToggleCompare={() => toggleCompare(c.id)}
            onEnlarge={() => setLightboxId(c.id)}
          />
        ))}
      </div>

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
  onToggleCompare,
  onEnlarge,
}: {
  concept: ConceptRow
  canSelect: boolean
  inCompare: boolean
  compareFull: boolean
  onToggleCompare: () => void
  onEnlarge: () => void
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

      {/* Bottom strip: enlarge + select-as-final */}
      <div className="absolute inset-x-2 bottom-2 z-10 flex items-center justify-between gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEnlarge}
          className="text-display rounded-full bg-background/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest backdrop-blur"
        >
          🔍 Enlarge
        </button>
        {canSelect && !concept.is_selected && (
          <form action={selectFinalConcept}>
            <input type="hidden" name="concept_id" value={concept.id} />
            <button
              type="submit"
              className="text-display rounded-full bg-success/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-success-foreground hover:bg-success"
            >
              Select as final
            </button>
          </form>
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
