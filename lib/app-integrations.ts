/**
 * App Builder content integrations that pull a live feed into the app. Each maps
 * to an installed extension id and a source URL stored in settings.integrations.
 */
export interface IntegrationDef {
  /** Matches the extension id in lib/app-extensions. */
  id: string
  label: string
  icon: string
  placeholder: string
  help: string
}

export const APP_INTEGRATIONS: IntegrationDef[] = [
  { id: 'rss_import', label: 'RSS Feed', icon: '📡', placeholder: 'https://example.com/feed', help: 'Latest items appear on your News screen.' },
  { id: 'wordpress_sync', label: 'WordPress', icon: '📰', placeholder: 'https://yourblog.com', help: 'Your latest WordPress posts sync into News.' },
  { id: 'youtube_int', label: 'YouTube', icon: '▶️', placeholder: 'Channel ID (UC…) or channel URL', help: 'Latest videos appear on your Videos screen.' },
]

export type AppIntegrations = Record<string, { url?: string }>
