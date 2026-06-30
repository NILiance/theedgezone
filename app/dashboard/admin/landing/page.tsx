import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { saveLandingSettings } from './actions'

export const metadata = { title: 'Landing Pages' }

const PRODUCTS = [
  { key: 'sites', domain: 'mytalentsite.com' },
  { key: 'epk', domain: 'talentepk.com' },
  { key: 'podcast', domain: 'podcastfortalent.com' },
  { key: 'stores', domain: 'nilstores.com' },
  { key: 'apps', domain: 'appsfortalent.com' },
]

const input = 'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'
const label = 'text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground'

export default async function AdminLandingPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  const { data } = supabase
    ? await supabase.from('landing_settings').select('*').eq('id', 1).maybeSingle()
    : { data: null }
  const s = (data ?? {}) as {
    accent_color?: string | null
    logo_url?: string | null
    footer_text?: string | null
    show_logo?: boolean
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Landing pages</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Sales page branding</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Colors, header logo, and footer for the product domain sales pages
          (mytalentsite.com, talentepk.com, podcastfortalent.com, nilstores.com, appsfortalent.com).
        </p>
      </div>

      <form
        action={saveLandingSettings}
        className="space-y-5 rounded-[var(--radius)] border border-border bg-panel/40 p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Accent color</span>
            <input
              name="accent_color"
              type="text"
              defaultValue={s.accent_color ?? ''}
              placeholder="#C8A84E — blank = each product’s default"
              className={`${input} font-mono`}
            />
          </label>
          <label className="block">
            <span className={label}>Footer text</span>
            <input
              name="footer_text"
              type="text"
              defaultValue={s.footer_text ?? 'Brought to you by The Edge Zone'}
              className={input}
            />
          </label>
        </div>

        {/* Logo */}
        <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-4">
          <span className={label}>Header logo</span>
          {s.logo_url && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.logo_url}
                alt="Current logo"
                className="h-10 w-auto rounded border border-border bg-white object-contain p-1"
              />
              <span className="text-[11px] text-muted-foreground">Current logo</span>
            </div>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Upload a logo</span>
              <input
                type="file"
                name="logo_file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="mt-1 block w-full rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-3 py-2 text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-[var(--radius-sm)] file:border file:border-border file:bg-panel-elevated file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-foreground hover:file:bg-primary hover:file:text-primary-foreground"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-muted-foreground">…or paste a logo URL</span>
              <input name="logo_url" type="url" placeholder="https://…" className={input} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="use_brand_logo" className="h-4 w-4" />
              Use my brand-design logo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="show_logo" defaultChecked={s.show_logo !== false} className="h-4 w-4" />
              Show logo in header
            </label>
            <label className="flex items-center gap-2 text-sm text-destructive">
              <input type="checkbox" name="clear_logo" value="1" className="h-4 w-4" />
              Remove logo
            </label>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Priority: uploaded file → “use my brand-design logo” → pasted URL. Leave all blank to
            keep the current logo.
          </p>
        </div>

        <button
          type="submit"
          className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
        >
          Save branding
        </button>
      </form>

      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className={label}>Preview the pages</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRODUCTS.map((p) => (
            <a
              key={p.key}
              href={`/lp/${p.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary"
            >
              {p.domain} →
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
