'use client'

import { AssetPicker } from '@/components/site/editor/asset-picker'
import {
  type AppTheme,
  APP_FONTS,
  NAV_STYLES,
  THEME_COLOR_FIELDS,
  defaultAppTheme,
} from '@/lib/app-theme'

/**
 * Design tab — the legacy App Builder's theme editor: 11 color tokens, heading
 * + body fonts, nav style, corner radius, light/dark mode, and the app icon.
 */
export function DesignTab({
  theme,
  onChange,
  iconUrl,
  onIcon,
}: {
  theme: AppTheme
  onChange: (patch: Partial<AppTheme>) => void
  iconUrl: string
  onIcon: (url: string) => void
}) {
  const setMode = (mode: 'dark' | 'light') => {
    // Re-seed the neutral tokens for the new mode, keep brand colors.
    const seeded = defaultAppTheme(theme.primary, theme.secondary, mode)
    onChange({
      mode,
      bg_color: seeded.bg_color,
      card_bg: seeded.card_bg,
      text_color: seeded.text_color,
      heading_color: seeded.heading_color,
      muted_color: seeded.muted_color,
      nav_bg: seeded.nav_bg,
      nav_text: seeded.nav_text,
    })
  }

  const selectCls =
    'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'

  return (
    <div className="space-y-5">
      {/* App icon + mode */}
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-eyebrow text-primary">App icon &amp; mode</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-xs text-muted-foreground">Icon (1024×1024 PNG)</span>
            <div className="mt-1">
              <AssetPicker value={iconUrl} onChange={onIcon} accept="image/png,image/jpeg" />
            </div>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">Appearance</span>
            <div className="mt-1 flex gap-2">
              {(['dark', 'light'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-sm capitalize ${
                    theme.mode === m
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-panel/40 text-muted-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-eyebrow text-primary">Colors</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_COLOR_FIELDS.map((f) => (
            <label key={f.key} className="block text-xs">
              <span className="block text-muted-foreground">{f.label}</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={String(theme[f.key] ?? '#000000')}
                  onChange={(e) => onChange({ [f.key]: e.target.value } as Partial<AppTheme>)}
                  className="h-8 w-10 shrink-0 rounded border border-border bg-transparent p-0.5"
                />
                <input
                  value={String(theme[f.key] ?? '')}
                  onChange={(e) => onChange({ [f.key]: e.target.value } as Partial<AppTheme>)}
                  className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 font-mono text-[11px]"
                />
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Typography + layout */}
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-eyebrow text-primary">Typography &amp; layout</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Heading font</span>
            <select value={theme.font_heading} onChange={(e) => onChange({ font_heading: e.target.value })} className={selectCls}>
              {APP_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Body font</span>
            <select value={theme.font_body} onChange={(e) => onChange({ font_body: e.target.value })} className={selectCls}>
              {APP_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Heading weight</span>
            <select value={theme.heading_weight} onChange={(e) => onChange({ heading_weight: e.target.value })} className={selectCls}>
              {['400', '500', '600', '700', '800', '900'].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-muted-foreground">Corner radius — {theme.border_radius}px</span>
            <input
              type="range"
              min={0}
              max={32}
              value={theme.border_radius}
              onChange={(e) => onChange({ border_radius: Number(e.target.value) })}
              className="mt-3 w-full accent-primary"
            />
          </label>
        </div>
        <div className="mt-3">
          <span className="block text-xs text-muted-foreground">Bottom nav style</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {NAV_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ nav_style: s.id })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  theme.nav_style === s.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-panel/40 text-muted-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
