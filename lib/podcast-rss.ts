/**
 * Builds an Apple/iTunes + podcast-namespace compliant RSS 2.0 feed for a
 * podcast and its published episodes. Hand-rolled XML (no dependency) — the
 * shape follows Apple's "Podcast RSS feed requirements".
 */

export interface RssPodcast {
  title: string
  description: string | null
  slug: string
  cover_url: string | null
  author: string | null
  category: string | null
  language: string | null
  explicit: boolean | null
  apple_connect_email: string | null
}

export interface RssEpisode {
  id: string
  title: string
  description: string | null
  audio_url: string | null
  audio_bytes: number | null
  audio_mime: string | null
  duration_seconds: number | null
  published_at: string | null
  guid: string | null
  episode_number: number | null
  season_number: number | null
  explicit: boolean | null
  image_url: string | null
  chapters?: unknown[] | null
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(s: string): string {
  // Guard against a literal "]]>" terminating the CDATA early.
  return `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function rfc2822(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toUTCString()
}

export function buildPodcastRss(
  podcast: RssPodcast,
  episodes: RssEpisode[],
  opts: { siteUrl: string; feedUrl: string; slug: string }
): string {
  const explicit = podcast.explicit ? 'true' : 'false'
  const lang = podcast.language || 'en'
  const link = `${opts.siteUrl}/podcasts/${podcast.slug}`
  const ownerName = podcast.author || podcast.title
  const ownerEmail = podcast.apple_connect_email || ''

  const channelImage = podcast.cover_url
    ? `<itunes:image href="${esc(podcast.cover_url)}"/>
    <image><url>${esc(podcast.cover_url)}</url><title>${esc(podcast.title)}</title><link>${esc(link)}</link></image>`
    : ''
  const category = podcast.category
    ? `<itunes:category text="${esc(podcast.category)}"/>`
    : ''
  const owner =
    ownerName || ownerEmail
      ? `<itunes:owner>${ownerName ? `<itunes:name>${esc(ownerName)}</itunes:name>` : ''}${
          ownerEmail ? `<itunes:email>${esc(ownerEmail)}</itunes:email>` : ''
        }</itunes:owner>`
      : ''

  const items = episodes
    .filter((e) => e.audio_url && e.published_at)
    .map((e) => {
      const epExplicit = e.explicit ? 'true' : 'false'
      // Route through the counting redirect so downloads are tracked.
      const enclosureUrl = `${opts.siteUrl}/podcasts/${opts.slug}/e/${e.id}/audio`
      const enclosure = `<enclosure url="${esc(enclosureUrl)}" length="${e.audio_bytes ?? 0}" type="${esc(
        e.audio_mime || 'audio/mpeg'
      )}"/>`
      const dur = e.duration_seconds ? `<itunes:duration>${Math.round(e.duration_seconds)}</itunes:duration>` : ''
      const epNum = e.episode_number != null ? `<itunes:episode>${e.episode_number}</itunes:episode>` : ''
      const seasonNum = e.season_number != null ? `<itunes:season>${e.season_number}</itunes:season>` : ''
      const epImage = e.image_url ? `<itunes:image href="${esc(e.image_url)}"/>` : ''
      const chaptersTag =
        Array.isArray(e.chapters) && e.chapters.length > 0
          ? `<podcast:chapters url="${esc(`${opts.siteUrl}/podcasts/${opts.slug}/e/${e.id}/chapters.json`)}" type="application/json+chapters"/>`
          : ''
      const desc = e.description || ''
      return `    <item>
      <title>${esc(e.title)}</title>
      <description>${cdata(desc)}</description>
      <content:encoded>${cdata(desc)}</content:encoded>
      <itunes:summary>${cdata(desc)}</itunes:summary>
      ${enclosure}
      <guid isPermaLink="false">${esc(e.guid || e.audio_url!)}</guid>
      <pubDate>${rfc2822(e.published_at)}</pubDate>
      ${dur}
      ${epNum}
      ${seasonNum}
      <itunes:explicit>${epExplicit}</itunes:explicit>
      ${epImage}
      ${chaptersTag}
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${esc(podcast.title)}</title>
    <link>${esc(link)}</link>
    <atom:link href="${esc(opts.feedUrl)}" rel="self" type="application/rss+xml"/>
    <language>${esc(lang)}</language>
    <description>${cdata(podcast.description || podcast.title)}</description>
    <itunes:summary>${cdata(podcast.description || podcast.title)}</itunes:summary>
    <itunes:author>${esc(podcast.author || podcast.title)}</itunes:author>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>${explicit}</itunes:explicit>
    ${category}
    ${owner}
    ${channelImage}
${items}
  </channel>
</rss>`
}
