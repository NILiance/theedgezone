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
export const FOCUSED_CATEGORY_SUBTABS: ReadonlyArray<ArsenalSubtab> = [
  'business_card',
  'letterhead',
  'thank_you_card',
  'presentation',
  'media_kit',
  'social_media',
  'phone_wallpaper',
  'story_highlight',
  'virtual_background',
  'email_signature_image',
  'icon_generator',
  'game_day',
]
