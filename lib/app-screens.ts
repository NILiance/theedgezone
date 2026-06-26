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
  { type: 'home', label: 'Home', icon: 'home', pattern: 'profile', description: 'Hero, headline + intro', defaultTitle: 'Home', defaultContent: { headline: '', bio: '', image: '' } },
  { type: 'about', label: 'About', icon: 'information-circle', pattern: 'text', description: 'Long-form about text', defaultTitle: 'About', defaultContent: { body: '' } },
  { type: 'bio', label: 'Bio', icon: 'person', pattern: 'profile', description: 'Photo + biography', defaultTitle: 'Bio', defaultContent: { headline: '', bio: '', image: '' } },
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
]

const BY_TYPE = new Map(SCREEN_TYPES.map((s) => [s.type, s]))

export function screenDef(type: string): ScreenTypeDef | undefined {
  return BY_TYPE.get(type)
}

export function screenPattern(type: string): ScreenPattern {
  return BY_TYPE.get(type)?.pattern ?? 'text'
}
