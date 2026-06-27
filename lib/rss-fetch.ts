/**
 * Minimal RSS 2.0 / Atom feed fetcher + parser (no dependency). Powers the
 * App Builder content integrations — RSS Feed Import, WordPress Sync (site +
 * /feed/), and YouTube (channel RSS). Server-only (uses fetch).
 */

export interface FeedItem {
  title: string
  link: string
  date: string // YYYY-MM-DD
  image: string
  snippet: string
}

const TIMEOUT_MS = 6000

/** Turn a user-entered source into a fetchable feed URL for the given kind. */
export function feedUrlFor(kind: string, input: string | undefined): string | null {
  const v = (input ?? '').trim()
  if (!v) return null
  if (kind === 'wordpress_sync') {
    if (/\/feed\/?$/i.test(v)) return v
    return v.replace(/\/+$/, '') + '/feed/'
  }
  if (kind === 'youtube_int') {
    if (/feeds\/videos\.xml/i.test(v)) return v
    if (/^UC[\w-]{16,}$/.test(v)) return `https://www.youtube.com/feeds/videos.xml?channel_id=${v}`
    const m = v.match(/channel\/(UC[\w-]+)/)
    if (m) return `https://www.youtube.com/feeds/videos.xml?channel_id=${m[1]}`
    return null // @handles need the YouTube API to resolve — unsupported here
  }
  return v // rss_import: use as-is
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tagText(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? decode(m[1]!) : ''
}

function attrOf(block: string, name: string, attr: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*\\b${attr}=["']([^"']+)["']`, 'i'))
  return m ? m[1]! : ''
}

function toDate(raw: string): string {
  if (!raw) return ''
  const t = Date.parse(raw)
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : ''
}

export async function fetchFeed(url: string, limit = 12): Promise<FeedItem[]> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'EdgeZoneApp/1.0 (+https://theedgezone.com)' },
      next: { revalidate: 600 },
    })
    clearTimeout(timer)
    if (!res.ok) return []
    const xml = await res.text()
    const isAtom = /<feed[\s>]/i.test(xml) && /<entry[\s>]/i.test(xml)

    const openRe = isAtom ? /<entry[\s>]/i : /<item[\s>]/i
    const closeRe = isAtom ? /<\/entry>/i : /<\/item>/i
    const chunks = xml.split(openRe).slice(1).map((b) => b.split(closeRe)[0] ?? '')

    const items: FeedItem[] = []
    for (const block of chunks.slice(0, limit)) {
      const title = tagText(block, 'title') || 'Untitled'
      let link = ''
      if (isAtom) {
        const vid = tagText(block, 'yt:videoId')
        link = vid ? `https://www.youtube.com/watch?v=${vid}` : attrOf(block, 'link', 'href')
      } else {
        link = tagText(block, 'link') || attrOf(block, 'enclosure', 'url')
      }
      const date = toDate(tagText(block, 'pubDate') || tagText(block, 'published') || tagText(block, 'updated'))
      const snippet = (tagText(block, 'description') || tagText(block, 'content:encoded') || tagText(block, 'summary') || tagText(block, 'media:description')).slice(0, 300)
      const image =
        attrOf(block, 'media:thumbnail', 'url') ||
        attrOf(block, 'media:content', 'url') ||
        attrOf(block, 'enclosure', 'url') ||
        (block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? '')
      items.push({ title, link, date, image, snippet })
    }
    return items
  } catch {
    return []
  }
}
