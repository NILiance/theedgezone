/**
 * App Builder Extension Store — the full 68-extension catalog, ported verbatim
 * from the legacy ez-app-mgr.js EXTENSIONS array. Installing an extension with a
 * `screen` auto-adds that screen to the app. Plain module (shared client/server).
 */

export interface AppExtension {
  id: string
  cat: string
  icon: string
  bg: string
  name: string
  desc: string
  price: string
  /** If set, installing this extension adds a screen of this type. */
  screen?: string
}

export const APP_EXTENSIONS: AppExtension[] = [
  // ── Content ──
  { id: 'blog', cat: 'Content', icon: '📝', bg: '#dbeafe', name: 'Blog / Articles', desc: 'Create and publish articles from your built-in CMS', price: 'Free', screen: 'blog' },
  { id: 'videos', cat: 'Content', icon: '🎬', bg: '#fce7f3', name: 'Video Gallery', desc: 'Share YouTube, Vimeo, and uploaded videos', price: 'Free', screen: 'videos' },
  { id: 'podcast', cat: 'Content', icon: '🎙️', bg: '#fef3c7', name: 'Podcasts', desc: 'Broadcast your podcast episodes with built-in player', price: 'Free', screen: 'podcast' },
  { id: 'gallery', cat: 'Content', icon: '📸', bg: '#d1fae5', name: 'Photo Gallery', desc: 'Publish photos with full-screen lightbox viewing', price: 'Free', screen: 'gallery' },
  { id: 'audio', cat: 'Content', icon: '🎵', bg: '#ede9fe', name: 'Audio Tracks', desc: 'Share music and audio tracks with inline player', price: 'Free', screen: 'audio' },
  { id: 'events_ext', cat: 'Content', icon: '📅', bg: '#fee2e2', name: 'Events & Calendar', desc: 'Publish events with dates, locations, and ticket links', price: 'Free', screen: 'events' },
  { id: 'links', cat: 'Content', icon: '🔗', bg: '#e0e7ff', name: 'Link in Bio', desc: 'Link-in-bio style page with all your important links', price: 'Free', screen: 'links' },
  { id: 'media_hub', cat: 'Content', icon: '📺', bg: '#fef9c3', name: 'Media Hub', desc: 'Combined photos, videos, and audio in one tabbed view', price: 'Free', screen: 'media_hub' },
  { id: 'faq', cat: 'Content', icon: '❓', bg: '#f3e8ff', name: 'FAQ', desc: 'Expandable FAQ accordion for common questions', price: 'Free', screen: 'faq' },
  { id: 'about_ext', cat: 'Content', icon: 'ℹ️', bg: '#dbeafe', name: 'About Page', desc: 'Dedicated about page with bio and key facts', price: 'Free', screen: 'about' },
  { id: 'schedule', cat: 'Content', icon: '🗓️', bg: '#ecfdf5', name: 'Schedule', desc: 'Display your weekly or seasonal schedule', price: 'Free', screen: 'schedule' },
  { id: 'rss_import', cat: 'Content', icon: '📡', bg: '#fff7ed', name: 'RSS Feed Import', desc: 'Auto-import content from any RSS feed into your app', price: 'Free' },
  { id: 'wordpress_sync', cat: 'Content', icon: '📰', bg: '#dbeafe', name: 'WordPress Sync', desc: 'Automatically sync your WordPress posts to your app', price: 'Free' },
  { id: 'bookmark', cat: 'Content', icon: '🔖', bg: '#fef3c7', name: 'Bookmarks', desc: 'Let users save and bookmark their favorite content', price: 'Free' },

  // ── Memberships & Login ──
  { id: 'auth', cat: 'Memberships & Login', icon: '🔐', bg: '#e0e7ff', name: 'User Authentication', desc: 'Username/password login to protect app sections', price: 'Free' },
  { id: 'subscriptions_ext', cat: 'Memberships & Login', icon: '⭐', bg: '#fef3c7', name: 'Memberships', desc: 'Subscription tiers with exclusive content access', price: 'Free', screen: 'subscriptions' },
  { id: 'user_groups', cat: 'Memberships & Login', icon: '👥', bg: '#dbeafe', name: 'User Groups', desc: 'Create groups and customize access rights per section', price: 'Free' },
  { id: 'exclusive_ext', cat: 'Memberships & Login', icon: '🔒', bg: '#fce7f3', name: 'Exclusive Content', desc: 'Lock premium content behind membership tiers', price: 'Free', screen: 'exclusive' },
  { id: 'social_login', cat: 'Memberships & Login', icon: '🔑', bg: '#d1fae5', name: 'Social Login', desc: 'Let users sign in with Google, Apple, or social accounts', price: 'Free' },

  // ── Monetization ──
  { id: 'shop_ext', cat: 'Monetization', icon: '🛍️', bg: '#fef3c7', name: 'Product Shop', desc: 'Sell products, merch, and digital goods in-app', price: 'Free', screen: 'shop' },
  { id: 'tip_jar_ext', cat: 'Monetization', icon: '💰', bg: '#d1fae5', name: 'Tip Jar / Donations', desc: 'Accept tips and donations from your fans', price: 'Free', screen: 'tip_jar' },
  { id: 'tickets_ext', cat: 'Monetization', icon: '🎟️', bg: '#fee2e2', name: 'Event Tickets', desc: 'Sell event tickets with QR code validation', price: 'Free', screen: 'tickets' },
  { id: 'merch_ext', cat: 'Monetization', icon: '👕', bg: '#ede9fe', name: 'Merch Store', desc: 'Print-on-demand merchandise powered by your brand', price: 'Free', screen: 'merch' },
  { id: 'affiliates_ext', cat: 'Monetization', icon: '🤝', bg: '#e0e7ff', name: 'Affiliate Links', desc: 'Showcase affiliate products and earn commissions', price: 'Free', screen: 'affiliates' },
  { id: 'admob', cat: 'Monetization', icon: '📊', bg: '#fef9c3', name: 'Ad Monetization', desc: 'Display ads and generate revenue with AdMob integration', price: 'Free' },
  { id: 'coupons', cat: 'Monetization', icon: '🎫', bg: '#fce7f3', name: 'Coupons & Promos', desc: 'Create discount codes and special offers', price: 'Free' },
  { id: 'loyalty', cat: 'Monetization', icon: '💎', bg: '#dbeafe', name: 'Loyalty Program', desc: 'Reward your most engaged fans with points and perks', price: '$4.99/mo' },

  // ── Fan Engagement ──
  { id: 'fan_wall_ext', cat: 'Fan Engagement', icon: '💬', bg: '#dbeafe', name: 'Fan Wall / Community', desc: 'Social feed where fans can post, comment, and interact', price: 'Free', screen: 'fan_wall' },
  { id: 'polls_ext', cat: 'Fan Engagement', icon: '📊', bg: '#fef3c7', name: 'Polls & Voting', desc: 'Create interactive polls and gather fan opinions', price: 'Free', screen: 'polls' },
  { id: 'leaderboard_ext', cat: 'Fan Engagement', icon: '🏆', bg: '#d1fae5', name: 'Fan Leaderboard', desc: 'Rank fans by engagement, points, and activity', price: 'Free', screen: 'leaderboard' },
  { id: 'live_ext', cat: 'Fan Engagement', icon: '🔴', bg: '#fee2e2', name: 'Live Streaming', desc: 'Go live and broadcast directly to your fans', price: 'Free', screen: 'live' },
  { id: 'shoutouts_ext', cat: 'Fan Engagement', icon: '📣', bg: '#ede9fe', name: 'Shoutouts', desc: 'Fans request personalized video shoutouts (paid)', price: 'Free', screen: 'shoutouts' },
  { id: 'chat', cat: 'Fan Engagement', icon: '💭', bg: '#e0e7ff', name: 'Direct Messaging', desc: 'Enable direct messaging between you and fans', price: 'Free' },
  { id: 'ugc', cat: 'Fan Engagement', icon: '📤', bg: '#fce7f3', name: 'User Submissions', desc: 'Let fans submit content, photos, and stories', price: 'Free' },
  { id: 'gamification', cat: 'Fan Engagement', icon: '🎮', bg: '#fef9c3', name: 'Gamification', desc: 'Badges, achievements, and challenges for fans', price: 'Free' },

  // ── Notifications ──
  { id: 'push_auto', cat: 'Notifications', icon: '🔔', bg: '#fef3c7', name: 'Auto Push Notifications', desc: 'Automatically notify users when you publish new content', price: 'Free' },
  { id: 'push_manual', cat: 'Notifications', icon: '📨', bg: '#dbeafe', name: 'Manual Push Notifications', desc: 'Send custom push notifications to all or selected users', price: 'Free' },
  { id: 'push_schedule', cat: 'Notifications', icon: '⏰', bg: '#ede9fe', name: 'Scheduled Notifications', desc: 'Schedule push notifications for future delivery', price: 'Free' },
  { id: 'geofencing', cat: 'Notifications', icon: '📍', bg: '#d1fae5', name: 'Geofencing', desc: 'Location-based notifications when fans enter an area', price: '$9.99/mo' },
  { id: 'email_notify', cat: 'Notifications', icon: '📧', bg: '#fee2e2', name: 'Email Notifications', desc: 'Send email updates alongside push notifications', price: 'Free' },

  // ── Design & Customization ──
  { id: 'custom_fonts', cat: 'Design', icon: '🔤', bg: '#e0e7ff', name: 'Custom Fonts', desc: 'Upload any font for ultra-customized typography', price: 'Free' },
  { id: 'icon_pack', cat: 'Design', icon: '🎨', bg: '#fce7f3', name: 'Icon Packs', desc: 'Premium icon libraries for a polished look', price: 'Free' },
  { id: 'color_ai', cat: 'Design', icon: '🎭', bg: '#fef9c3', name: 'Smart Color Palette', desc: 'Let our system create your perfect color palette', price: 'Free' },
  { id: 'stock_photos', cat: 'Design', icon: '🖼️', bg: '#dbeafe', name: 'Stock Photo Library', desc: 'Access thousands of high-resolution photos', price: 'Free' },
  { id: 'custom_css', cat: 'Design', icon: '💻', bg: '#ede9fe', name: 'Custom CSS', desc: 'Add custom CSS for advanced design customization', price: 'Free' },
  { id: 'splash_screen', cat: 'Design', icon: '📱', bg: '#d1fae5', name: 'Custom Splash Screen', desc: 'Branded splash screen on app launch', price: 'Free' },
  { id: 'dark_mode', cat: 'Design', icon: '🌙', bg: '#1e293b', name: 'Dark Mode Toggle', desc: 'Let users switch between light and dark themes', price: 'Free' },

  // ── Integrations ──
  { id: 'youtube_int', cat: 'Integrations', icon: '▶️', bg: '#fee2e2', name: 'YouTube', desc: 'Auto-sync your YouTube channel content to your app', price: 'Free' },
  { id: 'instagram_int', cat: 'Integrations', icon: '📷', bg: '#fce7f3', name: 'Instagram Feed', desc: 'Display your Instagram feed directly in your app', price: 'Free' },
  { id: 'tiktok_int', cat: 'Integrations', icon: '🎵', bg: '#1e293b', name: 'TikTok Feed', desc: 'Showcase your TikTok videos in your app', price: 'Free' },
  { id: 'spotify_int', cat: 'Integrations', icon: '🎧', bg: '#d1fae5', name: 'Spotify Integration', desc: 'Stream your Spotify playlists and podcasts', price: 'Free' },
  { id: 'stripe_int', cat: 'Integrations', icon: '💳', bg: '#dbeafe', name: 'Stripe Payments', desc: 'Accept credit card payments securely', price: 'Free' },
  { id: 'google_analytics', cat: 'Integrations', icon: '📈', bg: '#fef3c7', name: 'Google Analytics', desc: 'Track app usage with Google Analytics', price: 'Free' },
  { id: 'mailchimp_int', cat: 'Integrations', icon: '📬', bg: '#ede9fe', name: 'Mailchimp', desc: 'Sync app users to your Mailchimp email lists', price: 'Free' },
  { id: 'zapier_int', cat: 'Integrations', icon: '⚡', bg: '#fef9c3', name: 'Zapier', desc: 'Connect your app to 5000+ other services', price: 'Free' },
  { id: 'calendly_int', cat: 'Integrations', icon: '📅', bg: '#e0e7ff', name: 'Calendly Booking', desc: 'Let users book appointments directly in your app', price: 'Free' },
  { id: 'google_maps', cat: 'Integrations', icon: '🗺️', bg: '#d1fae5', name: 'Google Maps', desc: 'Display locations and points of interest on a map', price: 'Free' },

  // ── Analytics & Tools ──
  { id: 'analytics', cat: 'Analytics & Tools', icon: '📊', bg: '#dbeafe', name: 'App Analytics', desc: 'Track downloads, active users, and engagement metrics', price: 'Free' },
  { id: 'forms', cat: 'Analytics & Tools', icon: '📋', bg: '#d1fae5', name: 'Custom Forms', desc: 'Create forms to collect data from your users', price: 'Free' },
  { id: 'qr_codes', cat: 'Analytics & Tools', icon: '📱', bg: '#fef3c7', name: 'QR Code Generator', desc: 'Generate QR codes for marketing and sharing', price: 'Free' },
  { id: 'ab_testing', cat: 'Analytics & Tools', icon: '🔬', bg: '#ede9fe', name: 'A/B Testing', desc: 'Test different layouts and content to optimize engagement', price: '$9.99/mo' },
  { id: 'heatmaps', cat: 'Analytics & Tools', icon: '🔥', bg: '#fee2e2', name: 'User Heatmaps', desc: 'See where users tap and scroll in your app', price: '$4.99/mo' },
  { id: 'export_data', cat: 'Analytics & Tools', icon: '📤', bg: '#e0e7ff', name: 'Data Export', desc: 'Export user data, analytics, and content to CSV', price: 'Free' },

  // ── Smart Features ──
  { id: 'ai_content', cat: 'Smart Features', icon: '🤖', bg: '#ede9fe', name: 'Content Assistant', desc: 'Generate posts, descriptions, and content with one click', price: 'Free' },
  { id: 'ai_translate', cat: 'Smart Features', icon: '🌍', bg: '#dbeafe', name: 'Auto-Translate', desc: 'Automatically translate your app into 50+ languages', price: '$9.99/mo' },
  { id: 'ai_chatbot', cat: 'Smart Features', icon: '💬', bg: '#fef3c7', name: 'Smart Chatbot', desc: 'Chatbot that answers questions using your content', price: '$14.99/mo' },
  { id: 'ai_recommend', cat: 'Smart Features', icon: '✨', bg: '#fce7f3', name: 'Smart Recommendations', desc: 'Personalized content recommendations for each user', price: 'Free' },
  { id: 'ai_moderation', cat: 'Smart Features', icon: '🛡️', bg: '#d1fae5', name: 'Content Moderation', desc: 'Automatically filter inappropriate user-generated content', price: 'Free' },
]

/** Extension categories in display order, with counts. */
export function extensionCategories(): { name: string; count: number }[] {
  const order: string[] = []
  const counts: Record<string, number> = {}
  for (const x of APP_EXTENSIONS) {
    if (!(x.cat in counts)) {
      counts[x.cat] = 0
      order.push(x.cat)
    }
    counts[x.cat]++
  }
  return order.map((name) => ({ name, count: counts[name]! }))
}

export function extensionById(id: string): AppExtension | undefined {
  return APP_EXTENSIONS.find((x) => x.id === id)
}
