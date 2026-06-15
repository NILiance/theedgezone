'use client'

import { useActionState } from 'react'
import {
  adminUploadConcept,
  adminUploadFinalLogo,
  adminUploadBrandGuide,
  adminResetSelections,
  adminRegenerateKit,
  adminSendCredentials,
  adminSaveNotes,
  adminDeleteBrand,
  adminGrantCredits,
  type AdminBrandState,
  type GrantCreditsState,
} from './actions'

export function BrandAdminTools({
  brandId,
  existingNotes,
  adminConcepts,
}: {
  brandId: string
  existingNotes: string
  adminConcepts: Array<{ url: string; uploaded_at: string }>
}) {
  return (
    <div className="space-y-4">
      <p className="text-eyebrow text-accent">Admin tools</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <UploadCard
          brandId={brandId}
          action={adminUploadConcept}
          title="Upload concept"
          help="Push a design team concept into the talent's studio. Accepts PNG / JPG / WebP / SVG."
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
        />
        <UploadCard
          brandId={brandId}
          action={adminUploadFinalLogo}
          title="Upload final logo"
          help="Bypass the auto designer — stamp this image as the chosen final and mark the brand as selected."
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
        />
        <UploadCard
          brandId={brandId}
          action={adminUploadBrandGuide}
          title="Upload brand guide (PDF)"
          help="Custom PDF that overrides the auto-generated one. Talent sees it in the studio."
          accept="application/pdf"
        />
        <ActionCard
          brandId={brandId}
          action={adminRegenerateKit}
          title="Rebuild brand kit"
          help="Re-assemble the ZIP using the current final logo + colors. Use after edits."
          submitLabel="Rebuild ZIP"
          danger={false}
        />
        <ActionCard
          brandId={brandId}
          action={adminResetSelections}
          title="Reset selections"
          help="Clears shortlists + the final pick. Status drops to 'concept' and talent starts again."
          submitLabel="Reset"
          danger={true}
        />
        <ActionCard
          brandId={brandId}
          action={adminSendCredentials}
          title="Send 'designs ready' email"
          help="Emails the talent that fresh designs are uploaded with a sign-in link to the studio."
          submitLabel="Send email"
          danger={false}
        />
      </div>

      {adminConcepts.length > 0 && (
        <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
          <p className="text-eyebrow text-primary">Admin-uploaded concepts ({adminConcepts.length})</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {adminConcepts.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[var(--radius-sm)] border border-border bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.url} alt="" className="aspect-square w-full object-contain" />
              </a>
            ))}
          </div>
        </div>
      )}

      <NotesCard brandId={brandId} existingNotes={existingNotes} />

      <GrantCreditsCard brandId={brandId} />

      <form
        action={adminDeleteBrand}
        className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-4"
      >
        <input type="hidden" name="brand_id" value={brandId} />
        <p className="text-eyebrow text-destructive">Danger zone</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Permanently deletes this brand design + all concepts. Cannot be undone.
        </p>
        <button
          type="submit"
          className="text-display mt-3 rounded-[var(--radius-sm)] border border-destructive bg-destructive/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-destructive"
          onClick={(e) => {
            if (!confirm('Delete this brand design and every concept? This cannot be undone.')) {
              e.preventDefault()
            }
          }}
        >
          Delete brand design
        </button>
      </form>
    </div>
  )
}

function UploadCard({
  brandId,
  action,
  title,
  help,
  accept,
}: {
  brandId: string
  action: (prev: AdminBrandState, fd: FormData) => Promise<AdminBrandState>
  title: string
  help: string
  accept: string
}) {
  const [state, formAction, pending] = useActionState<AdminBrandState, FormData>(action, {})
  return (
    <form action={formAction} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <input type="hidden" name="brand_id" value={brandId} />
      <p className="text-eyebrow text-primary">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{help}</p>
      <input
        type="file"
        name="file"
        accept={accept}
        required
        className="mt-3 block w-full text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-[var(--radius-sm)] file:border file:border-border file:bg-panel-elevated file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-foreground hover:file:bg-primary hover:file:text-primary-foreground"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-display mt-3 rounded-[var(--radius-sm)] bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Uploading…' : 'Upload'}
      </button>
      {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
      {state.ok && (
        <p className="mt-2 text-xs text-success">
          {state.message ?? 'Done.'}
          {state.url && (
            <>
              {' '}
              <a href={state.url} target="_blank" rel="noopener noreferrer" className="underline">
                Open
              </a>
            </>
          )}
        </p>
      )}
    </form>
  )
}

function ActionCard({
  brandId,
  action,
  title,
  help,
  submitLabel,
  danger,
}: {
  brandId: string
  action: (prev: AdminBrandState, fd: FormData) => Promise<AdminBrandState>
  title: string
  help: string
  submitLabel: string
  danger: boolean
}) {
  const [state, formAction, pending] = useActionState<AdminBrandState, FormData>(action, {})
  return (
    <form
      action={formAction}
      className={`rounded-[var(--radius)] border ${danger ? 'border-destructive/40' : 'border-border'} bg-panel/40 p-4`}
    >
      <input type="hidden" name="brand_id" value={brandId} />
      <p className={`text-eyebrow ${danger ? 'text-destructive' : 'text-primary'}`}>{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{help}</p>
      <button
        type="submit"
        disabled={pending}
        className={`text-display mt-3 rounded-[var(--radius-sm)] ${
          danger
            ? 'border border-destructive bg-destructive/10 text-destructive'
            : 'bg-primary text-primary-foreground'
        } px-4 py-1.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50`}
      >
        {pending ? 'Working…' : submitLabel}
      </button>
      {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
      {state.ok && (
        <p className="mt-2 text-xs text-success">
          {state.message ?? 'Done.'}
          {state.url && (
            <>
              {' '}
              <a href={state.url} target="_blank" rel="noopener noreferrer" className="underline">
                Open
              </a>
            </>
          )}
        </p>
      )}
    </form>
  )
}

function NotesCard({ brandId, existingNotes }: { brandId: string; existingNotes: string }) {
  const [state, formAction, pending] = useActionState<AdminBrandState, FormData>(adminSaveNotes, {})
  return (
    <form action={formAction} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <input type="hidden" name="brand_id" value={brandId} />
      <p className="text-eyebrow text-primary">Admin notes</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Internal — talent never sees these. Use for design-team handoffs.
      </p>
      <textarea
        name="notes"
        defaultValue={existingNotes}
        rows={3}
        className="mt-3 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-display mt-3 rounded-[var(--radius-sm)] bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save notes'}
      </button>
      {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
      {state.ok && <p className="mt-2 text-xs text-success">{state.message ?? 'Saved.'}</p>}
    </form>
  )
}

function GrantCreditsCard({ brandId }: { brandId: string }) {
  const [state, formAction, pending] = useActionState<GrantCreditsState, FormData>(
    adminGrantCredits,
    {}
  )
  return (
    <form
      action={formAction}
      className="rounded-[var(--radius)] border border-accent/40 bg-accent/5 p-4"
    >
      <input type="hidden" name="brand_id" value={brandId} />
      <p className="text-eyebrow text-accent">Grant asset credits</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Adds to the brand&rsquo;s <code>asset_credits_total</code> so the talent can generate
        more Arsenal assets. Use for comp grants, support refunds, or VIP boosts.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          name="amount"
          min={1}
          max={1000}
          placeholder="10"
          defaultValue="10"
          className="h-9 w-24 rounded-md border border-border bg-background px-3 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent-foreground disabled:opacity-50"
        >
          {pending ? 'Granting…' : 'Grant credits'}
        </button>
        {state.ok && (
          <span className="text-display rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success">
            ✓ Credits granted (total: {state.newTotal})
          </span>
        )}
        {state.error && (
          <span className="text-xs text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  )
}
