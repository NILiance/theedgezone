/**
 * Merges live feed items (RSS / WordPress / YouTube) into a talent's app
 * screens at render time: RSS + WordPress posts prepend the News/Blog screen;
 * YouTube videos prepend the Videos screen. Server-only (fetches feeds).
 */
import { fetchFeed, feedUrlFor } from './rss-fetch'
import type { AppScreen } from './app-screens'

export type IntegrationConfig = Record<string, { url?: string } | undefined>

export async function applyFeeds(screens: AppScreen[], integrations: IntegrationConfig): Promise<AppScreen[]> {
  const posts: { title: string; body: string; date: string; image: string; link: string }[] = []
  const videos: { title: string; url: string }[] = []

  for (const kind of ['rss_import', 'wordpress_sync']) {
    const url = feedUrlFor(kind, integrations[kind]?.url)
    if (!url) continue
    const items = await fetchFeed(url)
    for (const it of items) posts.push({ title: it.title, body: it.snippet, date: it.date, image: it.image, link: it.link })
  }

  const ytUrl = feedUrlFor('youtube_int', integrations.youtube_int?.url)
  if (ytUrl) {
    const items = await fetchFeed(ytUrl)
    for (const it of items) if (it.link) videos.push({ title: it.title, url: it.link })
  }

  if (posts.length === 0 && videos.length === 0) return screens

  return screens.map((s) => {
    const content = (s.content ?? {}) as Record<string, unknown>
    if (posts.length > 0 && (s.type === 'blog' || s.type === 'news')) {
      const existing = Array.isArray(content.posts) ? (content.posts as unknown[]) : []
      return { ...s, content: { ...content, posts: [...posts, ...existing] } }
    }
    if (videos.length > 0 && s.type === 'videos') {
      const existing = Array.isArray(content.items) ? (content.items as unknown[]) : []
      return { ...s, content: { ...content, items: [...videos, ...existing] } }
    }
    return s
  })
}
