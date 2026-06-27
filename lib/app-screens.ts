/**
 * Mobile-app screen-type catalog. Shared by the visual screen builder (client)
 * and the Expo code generator (server), so it must stay a plain module (no
 * 'use client' / 'use server').
 *
 * Each of the ~24 screen types maps onto one of 7 render PATTERNS. The Expo
 * build renders by pattern; the editor shows a pattern-specific content editor.
 */

export type ScreenPattern =
  | 'profile' // hero image + headline + bio
  | 'text' // long-form rich text
  | 'links' // list of outbound links (social, sponsors, music)
  | 'list' // list of cards (schedule, news, stats, faq, leaderboard)
  | 'gallery' // image grid
  | 'video' // list of videos (open externally)
  | 'web' // embedded web view (shop, tickets, polls, fan wall)

export interface ScreenTypeDef {
  type: string
  label: string
  /** Ionicons name (@expo/vector-icons). */
  icon: string
  pattern: ScreenPattern
  description: string
  defaultTitle: string
  defaultContent: Record<string, unknown>
}

const linksContent = { items: [{ label: '', url: '' }] }
const listContent = { items: [{ title: '', subtitle: '', detail: '' }] }
const videoContent = { items: [{ title: '', url: '' }] }

export const SCREEN_TYPES: ScreenTypeDef[] = [
  { type: 'home', label: 'Home', icon: 'home', pattern: 'profile', description: 'Splash + name + nav grid', defaultTitle: 'Home', defaultContent: { splash_images: [], heading: '', name_style: 'bold', name_size: 100, name_position: 'center', show_name: true, show_nav_grid: true, effects: { tint: '#000000', tint_amount: 0.35, blur: 0, vignette: 0.2, gradient: 'bottom-fade', text_color: '#ffffff', text_effect: 'shadow' }, announcements: [] } },
  { type: 'about', label: 'About', icon: 'information-circle', pattern: 'text', description: 'Long-form about text', defaultTitle: 'About', defaultContent: { body: '' } },
  { type: 'bio', label: 'Bio', icon: 'person', pattern: 'profile', description: 'Photo, bio, stats', defaultTitle: 'Bio', defaultContent: { headline: '', bio: '', image: '', stats: [], achievements: '' } },
  { type: 'schedule', label: 'Schedule', icon: 'calendar', pattern: 'list', description: 'Upcoming games / events', defaultTitle: 'Schedule', defaultContent: listContent },
  { type: 'events', label: 'Events', icon: 'star', pattern: 'list', description: 'Appearances + meetups', defaultTitle: 'Events', defaultContent: listContent },
  { type: 'shop', label: 'Shop', icon: 'cart', pattern: 'web', description: 'Your store (embedded)', defaultTitle: 'Shop', defaultContent: { url: '' } },
  { type: 'tickets', label: 'Tickets', icon: 'ticket', pattern: 'web', description: 'Ticketing page (embedded)', defaultTitle: 'Tickets', defaultContent: { url: '' } },
  { type: 'merch', label: 'Merch', icon: 'shirt', pattern: 'web', description: 'Merch store (embedded)', defaultTitle: 'Merch', defaultContent: { url: '' } },
  { type: 'videos', label: 'Videos', icon: 'videocam', pattern: 'video', description: 'Video list', defaultTitle: 'Videos', defaultContent: videoContent },
  { type: 'highlights', label: 'Highlights', icon: 'flash', pattern: 'video', description: 'Highlight reels', defaultTitle: 'Highlights', defaultContent: videoContent },
  { type: 'gallery', label: 'Gallery', icon: 'images', pattern: 'gallery', description: 'Photo grid', defaultTitle: 'Gallery', defaultContent: { images: [] } },
  { type: 'photos', label: 'Photos', icon: 'camera', pattern: 'gallery', description: 'Photo grid', defaultTitle: 'Photos', defaultContent: { images: [] } },
  { type: 'social', label: 'Social', icon: 'share-social', pattern: 'links', description: 'Social links', defaultTitle: 'Social', defaultContent: linksContent },
  { type: 'links', label: 'Links', icon: 'link', pattern: 'links', description: 'Link in bio', defaultTitle: 'Links', defaultContent: linksContent },
  { type: 'sponsors', label: 'Sponsors', icon: 'pricetag', pattern: 'links', description: 'Sponsor links', defaultTitle: 'Sponsors', defaultContent: linksContent },
  { type: 'music', label: 'Music', icon: 'musical-notes', pattern: 'links', description: 'Streaming links', defaultTitle: 'Music', defaultContent: linksContent },
  { type: 'news', label: 'News', icon: 'newspaper', pattern: 'list', description: 'News / blog posts', defaultTitle: 'News', defaultContent: listContent },
  { type: 'blog', label: 'Blog', icon: 'create', pattern: 'list', description: 'Blog posts', defaultTitle: 'Blog', defaultContent: listContent },
  { type: 'podcast', label: 'Podcast', icon: 'mic', pattern: 'web', description: 'Podcast page (embedded)', defaultTitle: 'Podcast', defaultContent: { url: '' } },
  { type: 'stats', label: 'Stats', icon: 'stats-chart', pattern: 'list', description: 'Career stats', defaultTitle: 'Stats', defaultContent: listContent },
  { type: 'leaderboard', label: 'Leaderboard', icon: 'podium', pattern: 'list', description: 'Fan leaderboard', defaultTitle: 'Leaderboard', defaultContent: listContent },
  { type: 'fan_wall', label: 'Fan Wall', icon: 'people', pattern: 'web', description: 'Fan submissions (embedded)', defaultTitle: 'Fan Wall', defaultContent: { url: '' } },
  { type: 'polls', label: 'Polls', icon: 'bar-chart', pattern: 'web', description: 'Fan polls (embedded)', defaultTitle: 'Polls', defaultContent: { url: '' } },
  { type: 'faq', label: 'FAQ', icon: 'help-circle', pattern: 'list', description: 'Frequently asked questions', defaultTitle: 'FAQ', defaultContent: listContent },
  { type: 'contact', label: 'Contact', icon: 'mail', pattern: 'text', description: 'How to reach you', defaultTitle: 'Contact', defaultContent: { body: '' } },
  { type: 'web', label: 'Web page', icon: 'globe', pattern: 'web', description: 'Any embedded URL', defaultTitle: 'Web', defaultContent: { url: '' } },
  { type: 'subscriptions', label: 'Subscriptions', icon: 'card', pattern: 'list', description: 'Membership tiers', defaultTitle: 'Membership', defaultContent: listContent },
  { type: 'audio', label: 'Audio', icon: 'headset', pattern: 'video', description: 'Audio tracks', defaultTitle: 'Audio', defaultContent: videoContent },
  { type: 'live', label: 'Live', icon: 'radio', pattern: 'web', description: 'Livestream page (embedded)', defaultTitle: 'Live', defaultContent: { url: '' } },
  { type: 'exclusive', label: 'Exclusive', icon: 'lock-closed', pattern: 'list', description: 'Subscriber-only content', defaultTitle: 'Exclusive', defaultContent: listContent },
  { type: 'shoutouts', label: 'Shoutouts', icon: 'megaphone', pattern: 'text', description: 'Personalized video requests', defaultTitle: 'Shoutouts', defaultContent: { body: '' } },
  { type: 'profile', label: 'Profile', icon: 'person', pattern: 'profile', description: 'Bio, stats, achievements', defaultTitle: 'Profile', defaultContent: { headline: '', bio: '', image: '', stats: [], achievements: '' } },
  { type: 'media_hub', label: 'Media Hub', icon: 'images', pattern: 'gallery', description: 'Photos, videos & audio', defaultTitle: 'Media', defaultContent: { images: [] } },
  { type: 'affiliates', label: 'Affiliates', icon: 'pricetag', pattern: 'links', description: 'Affiliate links', defaultTitle: 'Shop My Picks', defaultContent: linksContent },
  { type: 'tip_jar', label: 'Tip Jar', icon: 'card', pattern: 'web', description: 'Tips & donations', defaultTitle: 'Tip Jar', defaultContent: { url: '' } },
]

/** Screen categories, in legacy display order. */
export const SCREEN_CATEGORIES = ['Essential', 'Content', 'Commerce', 'Fan Engagement', 'Utility'] as const

const SCREEN_CATEGORY: Record<string, (typeof SCREEN_CATEGORIES)[number]> = {
  home: 'Essential', profile: 'Essential', bio: 'Essential', about: 'Essential', contact: 'Essential', gallery: 'Essential', photos: 'Essential', links: 'Essential',
  blog: 'Content', news: 'Content', videos: 'Content', highlights: 'Content', audio: 'Content', music: 'Content', podcast: 'Content', media_hub: 'Content', social: 'Content',
  shop: 'Commerce', tickets: 'Commerce', merch: 'Commerce', subscriptions: 'Commerce', affiliates: 'Commerce', sponsors: 'Commerce', tip_jar: 'Commerce',
  fan_wall: 'Fan Engagement', exclusive: 'Fan Engagement', polls: 'Fan Engagement', leaderboard: 'Fan Engagement', live: 'Fan Engagement', shoutouts: 'Fan Engagement',
  events: 'Utility', faq: 'Utility', schedule: 'Utility', stats: 'Utility', web: 'Utility',
}

export function screenCategory(type: string): string {
  return SCREEN_CATEGORY[type] ?? 'Utility'
}

/** Screen-type defs grouped by category, for the categorized picker. */
export function screenTypesByCategory(): { category: string; defs: ScreenTypeDef[] }[] {
  return SCREEN_CATEGORIES.map((category) => ({
    category,
    defs: SCREEN_TYPES.filter((d) => screenCategory(d.type) === category),
  })).filter((g) => g.defs.length > 0)
}

const BY_TYPE = new Map(SCREEN_TYPES.map((s) => [s.type, s]))

export function screenDef(type: string): ScreenTypeDef | undefined {
  return BY_TYPE.get(type)
}

export function screenPattern(type: string): ScreenPattern {
  return BY_TYPE.get(type)?.pattern ?? 'text'
}

/** A configured screen in a talent's app. */
export interface AppScreen {
  id: string
  title: string
  icon?: string
  type: string
  content?: Record<string, unknown>
}

/** A bottom-tab-bar entry referencing a screen (legacy nav model). */
export interface NavItem {
  screen_id: string
  label: string
  icon: string
  visible: boolean
}

/** Ionicons name → emoji, so the web preview can show nav/screen icons. */
const ICON_EMOJI: Record<string, string> = {
  home: '🏠',
  'information-circle': 'ℹ️',
  person: '👤',
  calendar: '📅',
  star: '⭐',
  cart: '🛒',
  ticket: '🎟️',
  shirt: '👕',
  videocam: '🎥',
  flash: '⚡',
  images: '🖼️',
  camera: '📷',
  'share-social': '🔗',
  link: '🔗',
  pricetag: '🏷️',
  'musical-notes': '🎵',
  newspaper: '📰',
  create: '✍️',
  mic: '🎙️',
  'stats-chart': '📊',
  podium: '🏆',
  people: '👥',
  'bar-chart': '📊',
  'help-circle': '❓',
  mail: '✉️',
  globe: '🌐',
  card: '💳',
  headset: '🎧',
  radio: '📡',
  'lock-closed': '🔒',
  megaphone: '📣',
}

export function screenEmoji(iconName?: string): string {
  return (iconName && ICON_EMOJI[iconName]) || '📱'
}

/** Max bottom-nav items shown in a generated app (legacy: 5). */
export const MAX_NAV_ITEMS = 5
