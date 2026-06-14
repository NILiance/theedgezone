'use client'

import { useActionState } from 'react'
import { saveAppDefaults, type AppDefaultsState } from './actions'

type AppDefaultsRow = {
  default_links: unknown
  splash_ad: unknown
  footer_ad: unknown
  in_feed_ad: unknown
  interstitial_ad: unknown
  auto_enroll_edgezone_merch: boolean
  show_platform_merch: boolean
  revenue_share_talent: number
} | null

export function AppDefaultsForm({ initial }: { initial: AppDefaultsRow }) {
  const [state, action, pending] = useActionState<AppDefaultsState, FormData>(saveAppDefaults, {})

  const splash = (initial?.splash_ad as Record<string, unknown> | null) ?? null
  const footer = (initial?.footer_ad as Record<string, unknown> | null) ?? null
  const inFeed = (initial?.in_feed_ad as Record<string, unknown> | null) ?? null
  const interstitial = (initial?.interstitial_ad as Record<string, unknown> | null) ?? null

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow mb-3 text-primary">Default Links</p>
        <p className="mb-2 text-xs text-muted-foreground">
          JSON array of <code className="font-mono">{`{ title, url, icon, position }`}</code> objects.
          Position: <code className="font-mono">nav_grid</code> | <code className="font-mono">links_screen</code> | <code className="font-mono">footer</code>.
        </p>
        <textarea
          name="default_links"
          rows={6}
          defaultValue={JSON.stringify(initial?.default_links ?? [], null, 2)}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-background p-2 font-mono text-xs"
        />
      </section>

      <AdSection prefix="splash" label="Splash Banner Ad" data={splash} />
      <AdSection prefix="footer" label="Footer Banner Ad" data={footer} />
      <AdSection prefix="infeed" label="In-Feed Ad" data={inFeed} freq />
      <AdSection prefix="interstitial" label="Interstitial Ad" data={interstitial} />

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow mb-3 text-primary">Merch + Revenue</p>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="auto_enroll_edgezone_merch"
              defaultChecked={initial?.auto_enroll_edgezone_merch ?? true}
              className="h-4 w-4"
            />
            Auto-enroll new apps in Edge Zone merch
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="show_platform_merch"
              defaultChecked={initial?.show_platform_merch ?? true}
              className="h-4 w-4"
            />
            Show platform merch in talent shop screens
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">
              Talent revenue share (0–1, e.g. 0.85 = 85%)
            </span>
            <input
              type="number"
              name="revenue_share_talent"
              step="0.01"
              min="0"
              max="1"
              defaultValue={initial?.revenue_share_talent ?? 0.85}
              className="mt-1 w-32 rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
        </div>
      </section>

      {state.error && (
        <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-[var(--radius-sm)] border border-success/40 bg-success/5 p-3 text-sm text-success">
          App defaults saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save defaults'}
      </button>
    </form>
  )
}

function AdSection({
  prefix,
  label,
  data,
  freq,
}: {
  prefix: string
  label: string
  data: Record<string, unknown> | null
  freq?: boolean
}) {
  const enabled = Boolean(data?.enabled)
  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <label className="text-eyebrow flex items-center gap-2 text-primary">
        <input type="checkbox" name={`${prefix}_enabled`} defaultChecked={enabled} className="h-4 w-4" />
        {label}
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name={`${prefix}_image`}
          placeholder="Image URL"
          defaultValue={String((data?.image_url as string) ?? '')}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm"
        />
        <input
          name={`${prefix}_click`}
          placeholder="Click URL"
          defaultValue={String((data?.click_url as string) ?? '')}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm"
        />
        <input
          name={`${prefix}_label`}
          placeholder="Label"
          defaultValue={String((data?.label as string) ?? '')}
          className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm"
        />
        {freq && (
          <input
            name={`${prefix}_freq`}
            type="number"
            min={1}
            placeholder="Frequency (every N items)"
            defaultValue={Number((data?.frequency as number) ?? 0) || ''}
            className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm"
          />
        )}
      </div>
    </section>
  )
}
