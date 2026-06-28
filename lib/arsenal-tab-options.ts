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
  { key: 'zoom_out', name: 'Zoom Out' },
  { key: 'rotate', name: 'Rotate In' },
  { key: 'spin', name: 'Spin In' },
  { key: 'bounce', name: 'Bounce' },
  { key: 'pop', name: 'Pop' },
  { key: 'drop', name: 'Drop In' },
  { key: 'blur_in', name: 'Blur In' },
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

// Optional visual effects for the Gemini-generated arsenal items (presentation,
// social media). Mirrors EFFECT_FRAGMENTS in lib/arsenal-prompts.ts.
export const ARSENAL_EFFECTS = [
  { val: 'none', name: 'No Effect' },
  { val: 'color_burst', name: 'Color Burst' },
  { val: 'explosion', name: 'Explosion' },
  { val: 'gradient_glow', name: 'Gradient Glow' },
  { val: 'particles', name: 'Particles' },
  { val: 'light_streaks', name: 'Light Streaks' },
  { val: 'smoke', name: 'Smoke / Fog' },
  { val: 'geometric', name: 'Geometric Shapes' },
] as const

export const QR_TYPE_OPTIONS = [
  { value: 'url', name: 'URL / Link', placeholder: 'https://yourbrand.com' },
  { value: 'instagram', name: 'Instagram Profile', placeholder: 'yourhandle (or full URL)' },
  { value: 'tiktok', name: 'TikTok Profile', placeholder: '@yourhandle (or full URL)' },
  { value: 'youtube', name: 'YouTube Channel', placeholder: 'https://youtube.com/@yourchannel' },
  { value: 'x', name: 'X / Twitter', placeholder: 'yourhandle (or full URL)' },
  { value: 'facebook', name: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { value: 'linktree', name: 'Linktree', placeholder: 'yourhandle (or full URL)' },
  { value: 'email', name: 'Email', placeholder: 'you@example.com' },
  { value: 'phone', name: 'Phone', placeholder: '+1 555 555 5555' },
  { value: 'sms', name: 'Text Message (SMS)', placeholder: '+1 555 555 5555' },
  { value: 'whatsapp', name: 'WhatsApp', placeholder: '+1 555 555 5555' },
  { value: 'text', name: 'Plain Text', placeholder: 'Any text to encode' },
] as const
