/**
 * Site templates — matches `nil_sb_site_templates()` in the legacy builder.
 * A site template is a complete bundle that can be applied to a fresh
 * site: theme tokens + layout + header + footer + pages (each with seed
 * blocks). Applying overwrites the site's current state, so the user is
 * warned before they commit.
 */

import { THEME_PRESETS_BY_ID, type ThemeTokens } from './theme-presets'
import { PAGE_ARCHETYPES_BY_TYPE, type PageType, type SeedBlock } from './page-templates'

export interface TemplatePage {
  type: PageType
  title: string
  path: string
  /** Override the archetype seed if needed. */
  seed?: SeedBlock[]
}

export interface HeaderTemplate {
  show_site_title?: boolean
  show_nav?: boolean
  show_social_icons?: boolean
  cta_visible?: boolean
  cta_text?: string
  cta_url?: string
}

export interface FooterTemplate {
  columns: Array<{
    heading?: string
    elements: Array<{ type: string; props?: Record<string, unknown> }>
  }>
}

export interface SiteTemplate {
  id: string
  name: string
  category: 'athlete' | 'creator' | 'brand' | 'classic'
  description: string
  preset_id: string
  layout: string
  header: HeaderTemplate
  footer: FooterTemplate
  pages: TemplatePage[]
}

function p(type: PageType, overrides: Partial<TemplatePage> = {}): TemplatePage {
  const a = PAGE_ARCHETYPES_BY_TYPE[type]
  return {
    type,
    title: overrides.title ?? a.suggested_title,
    path: overrides.path ?? a.suggested_path,
    seed: overrides.seed,
  }
}

const standardHeader: HeaderTemplate = {
  show_site_title: true,
  show_nav: true,
  show_social_icons: true,
  cta_visible: true,
  cta_text: 'Contact',
  cta_url: '/contact',
}

const minimalFooter: FooterTemplate = {
  columns: [
    {
      heading: '',
      elements: [{ type: 'copyright' }, { type: 'branding' }],
    },
  ],
}

const standardFooter: FooterTemplate = {
  columns: [
    {
      heading: 'About',
      elements: [{ type: 'logo' }, { type: 'custom_text' }],
    },
    {
      heading: 'Connect',
      elements: [{ type: 'social_icons' }, { type: 'contact_info' }],
    },
    {
      heading: 'Legal',
      elements: [{ type: 'copyright' }, { type: 'branding' }],
    },
  ],
}

export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    id: 'bold-hero',
    name: 'Bold Hero',
    category: 'athlete',
    description: 'Big, loud hero with high contrast type. For athletes with a brand voice.',
    preset_id: 'scarlet-bold',
    layout: 'bold-stack',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('about'), p('gallery'), p('contact'), p('sponsors')],
  },
  {
    id: 'clean-editorial',
    name: 'Clean Editorial',
    category: 'creator',
    description: 'Long-form storytelling with editorial type and plenty of whitespace.',
    preset_id: 'paper-minimal',
    layout: 'editorial',
    header: { ...standardHeader, show_social_icons: false },
    footer: minimalFooter,
    pages: [p('home'), p('about'), p('blog'), p('contact')],
  },
  {
    id: 'card-grid',
    name: 'Card Grid',
    category: 'creator',
    description: 'Cards everywhere — portfolio / merch / posts.',
    preset_id: 'slate-pro',
    layout: 'cards',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('gallery'), p('blog'), p('contact')],
  },
  {
    id: 'neon-athlete',
    name: 'Neon Athlete',
    category: 'athlete',
    description: 'Loud cyber-glow look for elite-level athletes.',
    preset_id: 'neon-edge',
    layout: 'classic',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('stats'), p('gallery'), p('sponsors'), p('contact')],
  },
  {
    id: 'minimal-pro',
    name: 'Minimal Pro',
    category: 'classic',
    description: 'Pristine, professional — feels like a designer’s personal site.',
    preset_id: 'dark-carbon',
    layout: 'minimal',
    header: { ...standardHeader, show_social_icons: false, cta_visible: false },
    footer: minimalFooter,
    pages: [p('home'), p('about'), p('contact')],
  },
  {
    id: 'team-spirit',
    name: 'Team Spirit',
    category: 'athlete',
    description: 'School-color hero, achievements front and center.',
    preset_id: 'royal-gold',
    layout: 'classic',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('stats'), p('about'), p('sponsors'), p('contact')],
  },
  {
    id: 'social-star',
    name: 'Social Star',
    category: 'creator',
    description: 'Social-first landing — Instagram / TikTok / YouTube embeds.',
    preset_id: 'electric-violet',
    layout: 'centered',
    header: standardHeader,
    footer: minimalFooter,
    pages: [p('home'), p('social'), p('links'), p('contact')],
  },
  {
    id: 'classic-recruit',
    name: 'Classic Recruit',
    category: 'athlete',
    description: 'Recruiter-friendly — stats, highlights, contact, references.',
    preset_id: 'midnight-pro',
    layout: 'classic',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('stats'), p('about'), p('contact'), p('sponsors')],
  },
  {
    id: 'luxury-brand',
    name: 'Luxury Brand',
    category: 'brand',
    description: 'High-end aesthetic for athletes who lead with their personal brand.',
    preset_id: 'royal-gold',
    layout: 'editorial',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('about'), p('gallery'), p('sponsors'), p('contact')],
  },
  {
    id: 'media-hub',
    name: 'Media Hub',
    category: 'creator',
    description: 'YouTube / podcast / blog — for athletes building a media brand.',
    preset_id: 'midnight-emerald',
    layout: 'magazine',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('blog'), p('social'), p('contact')],
  },
  {
    id: 'draft-ready',
    name: 'Draft Ready',
    category: 'athlete',
    description: 'Pro draft prep — combine stats, lifestyle, and inquiry capture.',
    preset_id: 'stealth-ops',
    layout: 'split',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('stats'), p('about'), p('gallery'), p('contact'), p('sponsors')],
  },
  {
    id: 'streetwear',
    name: 'Streetwear',
    category: 'brand',
    description: 'Bold streetwear / merch-led aesthetic.',
    preset_id: 'blood-orange',
    layout: 'cards',
    header: standardHeader,
    footer: standardFooter,
    pages: [p('home'), p('gallery'), p('links'), p('contact')],
  },
  {
    id: 'wellness-athlete',
    name: 'Wellness Athlete',
    category: 'athlete',
    description: 'Lifestyle / wellness / longevity feel.',
    preset_id: 'forest-calm',
    layout: 'editorial',
    header: standardHeader,
    footer: minimalFooter,
    pages: [p('home'), p('about'), p('blog'), p('contact')],
  },
]

export const SITE_TEMPLATES_BY_ID = Object.fromEntries(
  SITE_TEMPLATES.map((t) => [t.id, t])
) as Record<string, SiteTemplate>

/** Convenience: look up the resolved tokens for a template. */
export function templateTokens(t: SiteTemplate): ThemeTokens {
  return THEME_PRESETS_BY_ID[t.preset_id]!.tokens
}
