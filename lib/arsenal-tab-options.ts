/**
 * Client-safe option constants for the Brand Arsenal sub-tabs.
 * Kept separate from lib/brand-addons.ts (which pulls in server-only
 * Supabase code) so client components can import these freely.
 */

export const LOGO_ANIMATION_STYLE_OPTIONS = [
  { key: 'fade', name: 'Fade In' },
  { key: 'slide_up', name: 'Slide Up' },
  { key: 'slide_down', name: 'Slide Down' },
  { key: 'zoom', name: 'Zoom In' },
  { key: 'rotate', name: 'Rotate In' },
  { key: 'bounce', name: 'Bounce' },
  { key: 'glitch', name: 'Glitch' },
  { key: 'reveal_wipe', name: 'Reveal Wipe' },
] as const

export const BRAND_VOICE_CONTENT_TYPES = [
  { value: 'social_captions', name: 'Social Captions' },
  { value: 'bio_lines', name: 'Bio Lines' },
  { value: 'taglines', name: 'Tagline Ideas' },
  { value: 'email_subjects', name: 'Email Subject Lines' },
  { value: 'sponsorship_pitch', name: 'Sponsorship Pitch Lines' },
  { value: 'gameday_posts', name: 'Game Day Posts' },
  { value: 'thank_you_notes', name: 'Thank You Notes' },
  { value: 'press_release', name: 'Press Release Blurbs' },
] as const

export const BRAND_VOICE_TONES = [
  'Professional',
  'Confident',
  'Casual',
  'Inspirational',
  'Bold',
  'Friendly',
  'Authentic',
  'Playful',
] as const

export const QR_TYPE_OPTIONS = [
  { value: 'url', name: 'URL / Link', placeholder: 'https://yourbrand.com' },
  {
    value: 'instagram',
    name: 'Instagram Profile',
    placeholder: 'https://instagram.com/yourhandle',
  },
  { value: 'tiktok', name: 'TikTok Profile', placeholder: 'https://tiktok.com/@yourhandle' },
  { value: 'linktree', name: 'Linktree', placeholder: 'https://linktr.ee/yourhandle' },
  { value: 'email', name: 'Email', placeholder: 'mailto:you@example.com' },
  { value: 'phone', name: 'Phone', placeholder: 'tel:+15555555555' },
] as const
