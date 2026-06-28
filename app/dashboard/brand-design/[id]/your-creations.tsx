'use client'

import { useActionState, useState } from 'react'
import {
  deleteAddonAction,
  requestQuoteAction,
  type DeleteAddonState,
  type RequestQuoteState,
} from './creations-actions'

export interface CreationRow {
  id: string
  kind: string
  url: string | null
  metadata: Record<string, unknown>
  created_at: string
}

const KIND_LABEL: Record<string, string> = {
  logo_on_photo: 'Logo on Photo',
  sport_uniform: 'Sport Uniform',
  merch_mockup: 'Merch Mockup',
  social_media: 'Social Media',
  business_card: 'Business Card',
  email_signature_image: 'Signature Graphic',
  virtual_background: 'Virtual Background',
  phone_wallpaper: 'Phone Wallpaper',
  story_highlight: 'Story Highlight',
  letterhead: 'Letterhead',
  presentation: 'Presentation',
  thank_you_card: 'Thank You Card',
  media_kit: 'Media Kit',
  icon_generator: 'Icon',
  game_day: 'Game Day',
  logo_animation: 'Logo Animation',
  brand_voice_doc: 'Brand Voice',
  brand_voice_lines: 'Brand Voice',
  qr_code: 'QR Code',
  email_signature: 'Email Signature (HTML)',
  social_avatars: 'Social Avatars',
  trading_card: 'Trading Card',
}

// Visual icon shown when the addon URL isn't a viewable image
// (HTML email signatures, markdown voice docs, etc.).
const KIND_ICON: Record<string, string> = {
  email_signature: '✉️',
  brand_voice_doc: '🗣️',
  brand_voice_lines: '🗣️',
  logo_animation: '🎬',
}

function isImageUrl(url: string | null): boolean {
  if (!url) return false
  // Strip query string before checking extension.
  const clean = url.split('?')[0]!.toLowerCase()
  return /\.(png|jpe?g|webp|gif|svg|avif|bmp)$/.test(clean)
}

// HTML creations (logo animations, email signatures) can render live in a
// sandboxed iframe instead of falling back to a "Click Download" placeholder.
function isHtmlUrl(url: string | null): boolean {
  if (!url) return false
  return /\.html?$/.test(url.split('?')[0]!.toLowerCase())
}

/**
 * Your Creations — grid of every asset the talent has generated for this
 * brand. Each tile carries an image preview + Download + Request Quote
 * + Delete buttons. Matches the legacy WP "YOUR CREATIONS" section.
 */
export function YourCreations({
  brandId,
  creations,
}: {
  brandId: string
  creations: CreationRow[]
}) {
  const [quoteFor, setQuoteFor] = useState<CreationRow | null>(null)

  if (creations.length === 0) {
    return (
      <section>
        <p className="text-eyebrow text-primary">Your Creations (0)</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate an asset above — it&rsquo;ll appear here with download and quote-request
          buttons.
        </p>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <p className="text-eyebrow text-primary">Your Creations ({creations.length})</p>
        <p className="text-[10px] text-muted-foreground">
          Click <strong>Request Quote</strong> on any item to get pricing on physical orders.
        </p>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {creations.map((c) => (
          <CreationTile
            key={c.id}
            brandId={brandId}
            creation={c}
            onRequestQuote={() => setQuoteFor(c)}
          />
        ))}
      </div>
      {quoteFor && (
        <QuoteModal
          brandId={brandId}
          creation={quoteFor}
          onClose={() => setQuoteFor(null)}
        />
      )}
    </section>
  )
}

function CreationTile({
  brandId,
  creation,
  onRequestQuote,
}: {
  brandId: string
  creation: CreationRow
  onRequestQuote: () => void
}) {
  const [delState, delAction, delPending] = useActionState<DeleteAddonState, FormData>(
    deleteAddonAction,
    {}
  )
  const meta = creation.metadata ?? {}
  const subLabel = describeCreation(creation.kind, meta as Record<string, unknown>)

  const handleDelete = () => {
    if (!confirm('Delete this generated asset?')) return
    const fd = new FormData()
    fd.set('addon_id', creation.id)
    fd.set('brand_id', brandId)
    delAction(fd)
  }

  const showImage = isImageUrl(creation.url)
  const showHtml = !showImage && isHtmlUrl(creation.url)
  const placeholderIcon = KIND_ICON[creation.kind] ?? '📄'
  // Logo animations (GIF, or legacy HTML) can be replayed — remounting the
  // <img>/<iframe> via a changing key restarts the animation from frame 0
  // (served from cache, so no re-download).
  const [replayKey, setReplayKey] = useState(0)
  const isGif = showImage && (creation.url ?? '').split('?')[0]!.toLowerCase().endsWith('.gif')
  const canReplay = creation.kind === 'logo_animation' || isGif
  // Changing the src (cache-bust) reliably restarts the animation from frame 0
  // — a key-only remount leaves a finished non-looping GIF on its last frame.
  const replaySrc =
    creation.url && replayKey > 0
      ? `${creation.url}${creation.url.includes('?') ? '&' : '?'}replay=${replayKey}`
      : (creation.url ?? '')
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40">
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden ${
          showImage || showHtml ? 'bg-white' : 'bg-panel-elevated'
        }`}
      >
        {showImage && creation.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={replaySrc}
            alt={subLabel}
            className="max-h-full max-w-full object-contain"
          />
        ) : showHtml && creation.url ? (
          // Self-contained HTML+CSS (no scripts) — sandbox="" is safe and the
          // CSS animation still plays. pointer-events-none keeps it a preview.
          <iframe
            src={replaySrc}
            title={subLabel}
            sandbox=""
            scrolling="no"
            className="pointer-events-none h-full w-full border-0"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-3 text-center">
            <span className="text-display text-5xl" aria-hidden>
              {placeholderIcon}
            </span>
            <span className="text-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {KIND_LABEL[creation.kind] ?? creation.kind}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Click Download to view
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-display text-sm font-bold">{subLabel}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          {KIND_LABEL[creation.kind] ?? creation.kind}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {canReplay && (
            <button
              type="button"
              onClick={() => setReplayKey((k) => k + 1)}
              className="text-display rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-panel"
            >
              ↻ Replay
            </button>
          )}
          {creation.url && (
            <a
              href={creation.url}
              download
              className="text-display rounded-[var(--radius-sm)] bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
            >
              ⬇ Download
            </a>
          )}
          {creation.kind !== 'logo_animation' && (
            <button
              type="button"
              onClick={onRequestQuote}
              className="text-display rounded-[var(--radius-sm)] border border-accent bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/20"
            >
              💬 Request Quote
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={delPending}
            aria-label="Delete"
            className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            🗑
          </button>
        </div>
        {delState.error && (
          <p className="mt-2 text-[10px] text-destructive">{delState.error}</p>
        )}
      </div>
    </div>
  )
}

/** Human-readable sub-label from metadata — surfaces the chosen platform,
 *  uniform item, placement, etc. so the talent can find a creation at a glance. */
function describeCreation(
  kind: string,
  meta: Record<string, unknown>
): string {
  const option =
    typeof meta.option === 'string'
      ? meta.option
      : typeof meta.placement === 'string'
        ? meta.placement
        : ''
  const sport = typeof meta.sport === 'string' ? meta.sport : ''
  const size = typeof meta.size === 'string' ? meta.size : ''
  const parts = [
    KIND_LABEL[kind] ?? kind,
    sport,
    option ? option.replace(/_/g, ' ') : '',
    size ? `(${size})` : '',
  ].filter(Boolean)
  return parts.join(' · ') || 'Generated asset'
}

function QuoteModal({
  brandId,
  creation,
  onClose,
}: {
  brandId: string
  creation: CreationRow
  onClose: () => void
}) {
  const [state, action, pending] = useActionState<RequestQuoteState, FormData>(
    requestQuoteAction,
    {}
  )

  if (state.ok) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-[var(--radius)] bg-background p-8 text-center shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-display text-2xl font-black text-success">✓ Quote requested</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Our team will follow up with pricing and fulfillment details within 1–2 business days.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-display mt-5 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <form
        action={action}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius)] bg-background shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="addon_id" value={creation.id} />

        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-display font-bold">Request a quote</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-panel-elevated px-2 py-0.5 text-sm font-bold hover:bg-panel"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            {creation.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creation.url}
                alt=""
                className="h-16 w-16 rounded border border-border bg-white object-contain"
              />
            )}
            <div>
              <p className="text-display text-sm font-bold">
                {describeCreation(creation.kind, creation.metadata)}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {KIND_LABEL[creation.kind] ?? creation.kind}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Want this produced as a real physical item? Tell us how many and where to ship —
            our team will reply with options and pricing.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Quantity">
              <input
                type="number"
                name="quantity"
                min={1}
                placeholder="e.g. 50"
                className="form-input"
              />
            </FormField>
            <FormField label="Sizes (if apparel)">
              <input
                type="text"
                name="sizes"
                placeholder="S, M, L, XL"
                className="form-input"
              />
            </FormField>
          </div>

          <FormField label="Delivery address">
            <textarea
              name="delivery_address"
              rows={2}
              placeholder="Street, city, state, ZIP"
              className="form-textarea"
            />
          </FormField>

          <FormField label="Notes">
            <textarea
              name="notes"
              rows={3}
              placeholder="Anything we should know — deadline, special placement, packaging…"
              className="form-textarea"
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Contact email">
              <input
                type="email"
                name="contact_email"
                placeholder="you@example.com"
                className="form-input"
              />
            </FormField>
            <FormField label="Phone (optional)">
              <input
                type="tel"
                name="contact_phone"
                placeholder="(555) 555-5555"
                className="form-input"
              />
            </FormField>
          </div>

          {state.error && (
            <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="text-display rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent-foreground disabled:opacity-50"
            >
              {pending ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </div>
      </form>

      <style jsx>{`
        :global(.form-input),
        :global(.form-textarea) {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}
