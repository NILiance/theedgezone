/**
 * Structural layouts — matches `nil_sb_get_layouts()` in the legacy
 * builder. A layout decides the chrome of every page (nav position,
 * hero style, content flow, footer style) and is applied site-wide.
 */

export type NavPosition = 'top' | 'sidebar' | 'floating' | 'none'
export type NavAlign = 'left' | 'center' | 'right'
export type HeroStyle = 'full-bleed' | 'split' | 'minimal' | 'card' | 'none'
export type ContentFlow = 'centered' | 'wide' | 'sidebar' | 'magazine'
export type FooterStyle = 'columns' | 'minimal' | 'stacked' | 'logo-bar'

export interface LayoutDef {
  id: string
  name: string
  description: string
  nav_position: NavPosition
  nav_align: NavAlign
  hero_style: HeroStyle
  content_flow: ContentFlow
  footer_style: FooterStyle
  /** ASCII wireframe — surfaces in the layout picker for visual selection. */
  wireframe: string
}

export const LAYOUTS: LayoutDef[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Top nav, full-bleed hero, single-column body, multi-column footer.',
    nav_position: 'top',
    nav_align: 'left',
    hero_style: 'full-bleed',
    content_flow: 'centered',
    footer_style: 'columns',
    wireframe: `╔════════════════╗
║  LOGO    NAV   ║
╠════════════════╣
║   ⬛ HERO ⬛   ║
║                ║
╟────────────────╢
║   ▤  Body  ▤   ║
║                ║
╠════════════════╣
║ ▪ ▪ ▪ FOOTER  ║
╚════════════════╝`,
  },
  {
    id: 'centered',
    name: 'Centered',
    description: 'Centered nav above a tall hero, body centered, minimal footer.',
    nav_position: 'top',
    nav_align: 'center',
    hero_style: 'full-bleed',
    content_flow: 'centered',
    footer_style: 'minimal',
    wireframe: `╔════════════════╗
║    LOGO  NAV   ║
╠════════════════╣
║    ⬛ HERO ⬛   ║
║                ║
╟────────────────╢
║     ▤ Body ▤    ║
║                ║
╠════════════════╣
║   © Footer  ▪  ║
╚════════════════╝`,
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Left rail nav + main column. Editorial / blog feel.',
    nav_position: 'sidebar',
    nav_align: 'left',
    hero_style: 'minimal',
    content_flow: 'sidebar',
    footer_style: 'minimal',
    wireframe: `╔════════════════╗
║ NAV │   HERO   ║
║     │          ║
║     │  ▤▤▤▤    ║
║     │  Body    ║
║     │          ║
║     │          ║
╠════════════════╣
║      © Footer  ║
╚════════════════╝`,
  },
  {
    id: 'hero-landing',
    name: 'Hero Landing',
    description: 'Single-screen landing — 100vh hero, no internal scroll until CTA.',
    nav_position: 'floating',
    nav_align: 'right',
    hero_style: 'full-bleed',
    content_flow: 'centered',
    footer_style: 'minimal',
    wireframe: `╔════════════════╗
║          ☰ NAV ║
║                ║
║    ⬛⬛⬛⬛⬛    ║
║      HERO      ║
║    [ CTA → ]   ║
║                ║
╠════════════════╣
║      © 2026    ║
╚════════════════╝`,
  },
  {
    id: 'split',
    name: 'Split',
    description: 'Hero split 50/50 between image and copy. Editorial nav across top.',
    nav_position: 'top',
    nav_align: 'left',
    hero_style: 'split',
    content_flow: 'wide',
    footer_style: 'columns',
    wireframe: `╔════════════════╗
║ LOGO       NAV ║
╠════════╦═══════╣
║ ⬛⬛⬛  ║ COPY ║
║ HERO   ║      ║
║ IMG    ║ CTA  ║
╠════════╩═══════╣
║   ▤  Body  ▤   ║
╠════════════════╣
║ ▪ ▪ ▪ FOOTER  ║
╚════════════════╝`,
  },
  {
    id: 'cards',
    name: 'Cards',
    description: 'Card grid throughout. Good for portfolios and merch.',
    nav_position: 'top',
    nav_align: 'left',
    hero_style: 'card',
    content_flow: 'wide',
    footer_style: 'stacked',
    wireframe: `╔════════════════╗
║ LOGO       NAV ║
╠════════════════╣
║ ┌──┐ ┌──┐ ┌──┐ ║
║ │  │ │  │ │  │ ║
║ └──┘ └──┘ └──┘ ║
║ ┌──┐ ┌──┐ ┌──┐ ║
║ │  │ │  │ │  │ ║
║ └──┘ └──┘ └──┘ ║
╠════════════════╣
║   FOOTER  ▪    ║
╚════════════════╝`,
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Editorial multi-column with mixed media. Great for content-heavy.',
    nav_position: 'top',
    nav_align: 'center',
    hero_style: 'full-bleed',
    content_flow: 'magazine',
    footer_style: 'columns',
    wireframe: `╔════════════════╗
║   LOGO   NAV   ║
╠════════════════╣
║    ⬛ HERO ⬛   ║
╠══════╦═════════╣
║ Body ║ Sidebar ║
║ ▤▤   ║   ▤▤    ║
║ ▤▤   ║   ▤▤    ║
║ ▤▤   ║         ║
╠══════╩═════════╣
║ ▪ ▪ ▪ FOOTER  ║
╚════════════════╝`,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'No hero, no images, just type. Ultra-clean.',
    nav_position: 'top',
    nav_align: 'center',
    hero_style: 'none',
    content_flow: 'centered',
    footer_style: 'minimal',
    wireframe: `╔════════════════╗
║    LOGO  NAV   ║
╠════════════════╣
║                ║
║     ▤▤▤▤▤▤     ║
║     Body       ║
║     ▤▤▤▤       ║
║                ║
╠════════════════╣
║      © 2026    ║
╚════════════════╝`,
  },
  {
    id: 'bold-stack',
    name: 'Bold Stack',
    description: 'Massive type, stacked sections, big visual statements.',
    nav_position: 'top',
    nav_align: 'left',
    hero_style: 'full-bleed',
    content_flow: 'centered',
    footer_style: 'stacked',
    wireframe: `╔════════════════╗
║ LOGO       NAV ║
╠════════════════╣
║ ⬛⬛⬛⬛⬛⬛⬛⬛ ║
║ ⬛  HUGE   ⬛ ║
║ ⬛⬛⬛⬛⬛⬛⬛⬛ ║
╠════════════════╣
║   STACK BODY   ║
╠════════════════╣
║ © STACK FOOTER ║
╚════════════════╝`,
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Long-form storytelling layout — narrow column, plenty of whitespace.',
    nav_position: 'top',
    nav_align: 'center',
    hero_style: 'minimal',
    content_flow: 'centered',
    footer_style: 'logo-bar',
    wireframe: `╔════════════════╗
║    LOGO  NAV   ║
╠════════════════╣
║      HERO      ║
╟────────────────╢
║                ║
║     ▤▤▤▤▤      ║
║     Body       ║
║     ▤▤▤▤▤      ║
║                ║
╠════════════════╣
║  LOGO  FOOTER  ║
╚════════════════╝`,
  },
]

export const LAYOUTS_BY_ID = Object.fromEntries(LAYOUTS.map((l) => [l.id, l])) as Record<
  string,
  LayoutDef
>
