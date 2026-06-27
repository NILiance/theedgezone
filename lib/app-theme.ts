/**
 * Mobile-app theme model — the design tokens a talent customizes in the App
 * Builder's Design tab. Plain module (no 'use client'/'use server') so the live
 * preview, the Design editor, and the Expo generator can all share it.
 *
 * Mirrors the legacy AppsForTalent theme object (11 color tokens + fonts + nav
 * style + radius + mode).
 */

export interface AppTheme {
  primary: string
  secondary: string
  accent: string
  bg_color: string
  card_bg: string
  text_color: string
  heading_color: string
  muted_color: string
  nav_bg: string
  nav_text: string
  nav_active: string
  mode: 'dark' | 'light'
  font_heading: string
  font_body: string
  heading_weight: string
  border_radius: number
  nav_style: 'icons_labels' | 'icons_only' | 'labels_only'
}

/** Fonts offered in the Design tab (legacy ez-app-mgr font list). */
export const APP_FONTS = [
  'System Default',
  'DM Sans',
  'Inter',
  'Poppins',
  'Montserrat',
  'Raleway',
  'Oswald',
  'Roboto',
  'Open Sans',
  'Lato',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
] as const

export const NAV_STYLES: { id: AppTheme['nav_style']; label: string }[] = [
  { id: 'icons_labels', label: 'Icons + Labels' },
  { id: 'icons_only', label: 'Icons only' },
  { id: 'labels_only', label: 'Labels only' },
]

/** Color tokens exposed as labeled swatches in the Design tab. */
export const THEME_COLOR_FIELDS: { key: keyof AppTheme; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'bg_color', label: 'Background' },
  { key: 'card_bg', label: 'Card' },
  { key: 'heading_color', label: 'Heading text' },
  { key: 'text_color', label: 'Body text' },
  { key: 'muted_color', label: 'Muted text' },
  { key: 'nav_bg', label: 'Nav bar' },
  { key: 'nav_text', label: 'Nav icon' },
  { key: 'nav_active', label: 'Nav active' },
]

/** A full default theme seeded from the app's primary/secondary/mode. */
export function defaultAppTheme(
  primary = '#C8A84E',
  secondary = '#000000',
  mode: 'dark' | 'light' = 'dark'
): AppTheme {
  const dark = mode === 'dark'
  return {
    primary,
    secondary,
    accent: '#2ecc71',
    bg_color: dark ? '#050a0f' : '#f6f7f9',
    card_bg: dark ? '#0d1117' : '#ffffff',
    text_color: dark ? '#e8e8e8' : '#1c2330',
    heading_color: dark ? '#ffffff' : '#0b0e12',
    muted_color: dark ? '#8892a0' : '#697586',
    nav_bg: dark ? '#0a0e14' : '#ffffff',
    nav_text: dark ? '#888888' : '#8a93a2',
    nav_active: primary,
    mode,
    font_heading: 'DM Sans',
    font_body: 'DM Sans',
    heading_weight: '700',
    border_radius: 16,
    nav_style: 'icons_labels',
  }
}

/**
 * Resolves the saved theme (settings.theme) over fresh defaults seeded from the
 * app's column colors/mode — so older apps without a theme object still render.
 */
export function resolveAppTheme(
  saved: unknown,
  primary = '#C8A84E',
  secondary = '#000000',
  mode: 'dark' | 'light' = 'dark'
): AppTheme {
  const base = defaultAppTheme(primary, secondary, mode)
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    return { ...base, ...(saved as Partial<AppTheme>) }
  }
  return base
}
