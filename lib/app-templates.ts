/**
 * App "Get Started" templates — ported from ez-app-mgr.js TEMPLATES. Applying a
 * template seeds the screen list. Plain module (shared client/server).
 */

export interface AppTemplate {
  id: string
  icon: string
  label: string
  desc: string
  /** Screen types this template sets up (always starts with home). */
  screens: string[]
}

export const APP_TEMPLATES: AppTemplate[] = [
  { id: 'rising_star', icon: '⭐', label: 'Rising Star', desc: 'Perfect for athletes building their brand', screens: ['home', 'profile', 'schedule', 'gallery', 'links'] },
  { id: 'content_creator', icon: '🎬', label: 'Content Creator', desc: 'Videos, blog, and social media hub', screens: ['home', 'blog', 'videos', 'social'] },
  { id: 'musician', icon: '🎵', label: 'Musician', desc: 'Music, merch, and event listings', screens: ['home', 'music', 'audio', 'events', 'merch'] },
  { id: 'entrepreneur', icon: '💼', label: 'Entrepreneur', desc: 'Shop, subscriptions, and business links', screens: ['home', 'shop', 'subscriptions', 'links'] },
  { id: 'influencer', icon: '📸', label: 'Influencer', desc: 'Gallery, links, and fan engagement', screens: ['home', 'gallery', 'links', 'fan_wall', 'polls'] },
  { id: 'community', icon: '🤝', label: 'Community', desc: 'Fan wall, polls, and exclusive content', screens: ['home', 'fan_wall', 'polls', 'exclusive'] },
]
