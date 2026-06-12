/**
 * Page archetypes — matches `nil_sb_page_template()` in the legacy builder.
 * When a user adds a new page they pick an archetype and it gets seeded
 * with a sensible default block list (so the page isn't empty on day 1).
 */

import { defaultPropsFor } from './block-types'

export type PageType =
  | 'home'
  | 'about'
  | 'gallery'
  | 'contact'
  | 'sponsors'
  | 'blog'
  | 'stats'
  | 'links'
  | 'social'
  | 'custom'

export interface SeedBlock {
  block_type: string
  props: Record<string, unknown>
}

export interface PageArchetype {
  type: PageType
  label: string
  description: string
  suggested_title: string
  suggested_path: string
  seed: SeedBlock[]
}

function block(type: string, overrides: Record<string, unknown> = {}): SeedBlock {
  return {
    block_type: type,
    props: { ...defaultPropsFor(type), ...overrides },
  }
}

export const PAGE_ARCHETYPES: PageArchetype[] = [
  {
    type: 'home',
    label: 'Home',
    description: 'Hero + intro + stats + CTA. Your front door.',
    suggested_title: 'Home',
    suggested_path: '/',
    seed: [
      block('hero', {
        heading: 'Your Name',
        subheading: 'Athlete · Class of 20XX · School',
        cta_text: 'Get in touch',
        cta_url: '#contact',
      }),
      block('stats'),
      block('text', {
        content:
          'Tell your story here. Who you are, what you do, why brands and fans should pay attention.',
      }),
      block('cta', { heading: 'Want to work together?', button_text: 'Reach out', button_url: '/contact' }),
    ],
  },
  {
    type: 'about',
    label: 'About',
    description: 'Long-form story, achievements, sponsors, testimonials.',
    suggested_title: 'About',
    suggested_path: '/about',
    seed: [
      block('heading', { content: 'About', size: 'h1' }),
      block('text', {
        content:
          'Your background — where you grew up, how you started, what drives you. 2–3 short paragraphs land best.',
      }),
      block('achievements'),
      block('testimonial'),
      block('sponsors'),
    ],
  },
  {
    type: 'gallery',
    label: 'Gallery',
    description: 'Photo-led — grids of imagery from games, training, lifestyle.',
    suggested_title: 'Gallery',
    suggested_path: '/gallery',
    seed: [
      block('heading', { content: 'Gallery', size: 'h1', alignment: 'center' }),
      block('gallery', { title: 'On the field', columns: 3 }),
      block('gallery', { title: 'Lifestyle', columns: 3 }),
    ],
  },
  {
    type: 'contact',
    label: 'Contact',
    description: 'Inquiry form + scheduling embed + direct contact.',
    suggested_title: 'Contact',
    suggested_path: '/contact',
    seed: [
      block('heading', { content: 'Get in touch', size: 'h1', alignment: 'center' }),
      block('text', {
        content:
          'Brand partnerships, appearances, media requests — drop a note below or book a time on my calendar.',
        alignment: 'center',
      }),
      block('contact_form'),
      block('booking'),
    ],
  },
  {
    type: 'sponsors',
    label: 'Sponsors',
    description: 'Showcase partners and let brands inquire about partnerships.',
    suggested_title: 'Sponsors',
    suggested_path: '/sponsors',
    seed: [
      block('heading', { content: 'Partners', size: 'h1', alignment: 'center' }),
      block('sponsors', { title: '' }),
      block('testimonial', { title: 'What partners say' }),
      block('cta', {
        heading: 'Partner with me',
        subheading: 'I work with brands that fit my values and my audience.',
        button_text: 'Start a conversation',
        button_url: '/contact',
      }),
    ],
  },
  {
    type: 'blog',
    label: 'Blog',
    description: 'Posts feed plus an email signup.',
    suggested_title: 'Blog',
    suggested_path: '/blog',
    seed: [
      block('heading', { content: 'Blog', size: 'h1' }),
      block('blog_feed'),
      block('email_capture'),
    ],
  },
  {
    type: 'stats',
    label: 'Stats',
    description: 'Detailed stats / career numbers / season summaries.',
    suggested_title: 'Stats',
    suggested_path: '/stats',
    seed: [
      block('heading', { content: 'Career stats', size: 'h1', alignment: 'center' }),
      block('stats', { layout: 'detailed', title: '' }),
      block('achievements'),
      block('schedule'),
    ],
  },
  {
    type: 'links',
    label: 'Links',
    description: 'Linktree-style hub of every place you live online.',
    suggested_title: 'Links',
    suggested_path: '/links',
    seed: [
      block('hero', {
        heading: 'Find me',
        subheading: '',
        height: '40vh',
        text_align: 'center',
      }),
      block('links', {
        title: '',
        subtitle: '',
        style: 'pill',
        links: [
          { label: 'Instagram', url: '' },
          { label: 'TikTok', url: '' },
          { label: 'YouTube', url: '' },
          { label: 'Email me', url: 'mailto:' },
        ],
      }),
    ],
  },
  {
    type: 'social',
    label: 'Social',
    description: 'Social-first landing with feeds and an embed.',
    suggested_title: 'Social',
    suggested_path: '/social',
    seed: [
      block('heading', { content: 'Follow me', size: 'h1', alignment: 'center' }),
      block('social_feed', { style: 'cards' }),
      block('social_embed'),
    ],
  },
  {
    type: 'custom',
    label: 'Blank',
    description: 'Start from scratch — empty page.',
    suggested_title: 'New page',
    suggested_path: '/new-page',
    seed: [],
  },
]

export const PAGE_ARCHETYPES_BY_TYPE = Object.fromEntries(
  PAGE_ARCHETYPES.map((a) => [a.type, a])
) as Record<PageType, PageArchetype>

export function seedFor(type: string): SeedBlock[] {
  return PAGE_ARCHETYPES_BY_TYPE[type as PageType]?.seed ?? []
}
