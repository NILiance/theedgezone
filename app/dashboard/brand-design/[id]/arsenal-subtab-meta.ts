/**
 * Arsenal sub-tab metadata shared by BOTH the server page (page.tsx) and the
 * client nav (arsenal-subtabs.tsx).
 *
 * This is intentionally a PLAIN module (no 'use client'). A runtime value
 * exported from a 'use client' module and imported into a Server Component
 * does NOT arrive as the real value — it becomes a client-reference proxy, so
 * calling e.g. `FOCUSED_CATEGORY_SUBTABS.includes(...)` on the server throws
 * "includes is not a function" and crashes the render. Keeping the value here
 * lets the server import the real array.
 */
export type ArsenalSubtab =
  | 'create'
  // Group landing pages (card grids)
  | 'visual'
  | 'comms'
  | 'print'
  | 'digital'
  // Visual Assets
  | 'logo_animation'
  | 'trading_card'
  | 'social_avatars'
  // Comms
  | 'brand_voice'
  | 'qr_code'
  | 'email_signature'
  // Print
  | 'business_card'
  | 'letterhead'
  | 'thank_you_card'
  | 'presentation'
  | 'media_kit'
  // Digital
  | 'social_media'
  | 'phone_wallpaper'
  | 'story_highlight'
  | 'virtual_background'
  | 'email_signature_image'
  | 'icon_generator'
  | 'game_day'
  // Toolkit
  | 'brand_toolkit'

/**
 * Subtab IDs that map directly to a CategoryDef in arsenal-grid.tsx.
 * page.tsx (a Server Component) uses this to render the focused single-category
 * view, so it must live in a non-client module.
 */
// Placement-editor items (logo size + location + background colour + effects) —
// handled by the PlacementEditor, not the generic focused-category generator.
export const PLACEMENT_SUBTABS: ReadonlyArray<ArsenalSubtab> = [
  'phone_wallpaper',
  'story_highlight',
  'virtual_background',
]

export const FOCUSED_CATEGORY_SUBTABS: ReadonlyArray<ArsenalSubtab> = [
  'business_card',
  'letterhead',
  'thank_you_card',
  'presentation',
  'media_kit',
  'social_media',
  'email_signature_image',
  'icon_generator',
]

export type ArsenalGroup = 'visual' | 'comms' | 'print' | 'digital'
export const ARSENAL_GROUPS: ReadonlyArray<ArsenalGroup> = ['visual', 'comms', 'print', 'digital']

export interface ArsenalCard {
  id: ArsenalSubtab
  label: string
  icon: string
  color: string
  blurb: string
}

// Each group tab renders these as a card grid; clicking a card opens that
// item's generator. (Print + Digital ids are FOCUSED_CATEGORY_SUBTABS that
// open the arsenal-grid generator; Visual + Comms ids open dedicated tabs.)
export const ARSENAL_GROUP_META: Record<
  ArsenalGroup,
  { label: string; intro: string; cards: ArsenalCard[] }
> = {
  visual: {
    label: 'Visual Assets',
    intro: 'Eye-catching assets built from your logo. Click any to open the generator.',
    cards: [
      { id: 'logo_animation', label: 'Logo Animation', icon: '🎬', color: '#a78bfa', blurb: 'Animate your logo in 8 motion styles — download a looping GIF.' },
      { id: 'trading_card', label: 'Trading Card', icon: '🃏', color: '#22d3ee', blurb: 'Front + back collectible card with your photo, stats and colors.' },
      { id: 'social_avatars', label: 'Social Avatars', icon: '🖼️', color: '#3aa7ff', blurb: 'Your logo sized for every platform profile picture.' },
    ],
  },
  comms: {
    label: 'Communications',
    intro: 'Branded touchpoints for outreach and email. Click any to open the generator.',
    cards: [
      { id: 'brand_voice', label: 'Brand Voice', icon: '🗣️', color: '#e67e22', blurb: 'On-brand captions, bios and post copy in your voice.' },
      { id: 'email_signature', label: 'Email Signature (HTML)', icon: '✉️', color: '#2ecc71', blurb: 'Copy-paste HTML signature for Gmail / Outlook.' },
      { id: 'qr_code', label: 'QR Code', icon: '🔳', color: '#1abc9c', blurb: 'Branded QR to your site or profile — for cards and posters.' },
    ],
  },
  print: {
    label: 'Print',
    intro: 'Print-ready branded collateral. Click any to open the generator.',
    cards: [
      { id: 'business_card', label: 'Business Card', icon: '💼', color: '#3498db', blurb: 'Premium 3.5×2 card with logo, name, contact and socials.' },
      { id: 'letterhead', label: 'Letterhead', icon: '📄', color: '#3498db', blurb: 'A4 letterhead header — logo left, contact right-aligned.' },
      { id: 'thank_you_card', label: 'Thank You Card', icon: '💌', color: '#e91e63', blurb: 'Vertical 5×7 card with logo and a bold "THANK YOU".' },
      { id: 'presentation', label: 'Presentation Template', icon: '📊', color: '#9b59b6', blurb: '16:9 title slide for Keynote / Google Slides.' },
      { id: 'media_kit', label: 'Media Kit Cover', icon: '📋', color: '#00BCD4', blurb: 'Magazine-style press-kit cover with your socials.' },
    ],
  },
  digital: {
    label: 'Digital',
    intro: 'Assets for every screen and platform. Click any to open the generator.',
    cards: [
      { id: 'social_media', label: 'Social Media', icon: '📱', color: '#e67e22', blurb: 'Templates for IG, TikTok, YouTube, LinkedIn and more.' },
      { id: 'phone_wallpaper', label: 'Phone Wallpaper', icon: '📱', color: '#e74c3c', blurb: 'iPhone lockscreen with logo and brand pattern.' },
      { id: 'story_highlight', label: 'Story Highlight Covers', icon: '⭐', color: '#f39c12', blurb: 'Circular IG highlight icons by theme.' },
      { id: 'virtual_background', label: 'Virtual Background', icon: '💻', color: '#1abc9c', blurb: 'Zoom / Teams / Meet background in your colors.' },
      { id: 'email_signature_image', label: 'Signature Graphic', icon: '🖼️', color: '#2ecc71', blurb: '600×200 signature graphic for email.' },
      { id: 'icon_generator', label: 'Icon Generator', icon: '💎', color: '#1abc9c', blurb: 'App icons, favicons, avatars — every surface.' },
      { id: 'game_day', label: 'Game Day', icon: '🏆', color: '#f1c40f', blurb: 'Matchup, countdown and final-score graphics.' },
    ],
  },
}

// Reverse lookup: which group an item subtab belongs to (so the nav can
// highlight the parent group tab when you're inside an item generator).
export const SUBTAB_GROUP: Partial<Record<ArsenalSubtab, ArsenalGroup>> = Object.fromEntries(
  ARSENAL_GROUPS.flatMap((g) => ARSENAL_GROUP_META[g].cards.map((c) => [c.id, g] as const))
)

// The creation `kind`s each tab owns, so a tab's "Your Creations" only shows
// its own assets (not everything). Most card ids equal the recorded kind;
// brand_voice is the exception (it records lines/doc).
export function creationKindsForTab(tab: ArsenalSubtab | ArsenalGroup): string[] {
  switch (tab) {
    case 'create':
      return ['logo_on_photo', 'sport_uniform', 'merch_mockup']
    case 'visual':
      return ['logo_animation', 'trading_card', 'social_avatars']
    case 'comms':
      return ['brand_voice_lines', 'brand_voice_doc', 'email_signature', 'qr_code']
    case 'print':
      return ['business_card', 'letterhead', 'thank_you_card', 'presentation', 'media_kit']
    case 'digital':
      return [
        'social_media',
        'phone_wallpaper',
        'story_highlight',
        'virtual_background',
        'email_signature_image',
        'icon_generator',
        'game_day',
      ]
    default:
      return []
  }
}
