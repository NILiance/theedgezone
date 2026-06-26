/**
 * App Store / Google Play submission intake — field config.
 * The whole listing is a flat Record<string, unknown> stored in
 * talent_apps.store_listing. Shared by the editor + completeness calc.
 */

export type ListingFieldKind =
  | 'text'
  | 'textarea'
  | 'url'
  | 'select'
  | 'checkbox'
  | 'image'
  | 'images'

export interface ListingField {
  key: string
  label: string
  kind: ListingFieldKind
  options?: string[]
  help?: string
  maxLength?: number
  required?: boolean
}

export interface ListingSection {
  title: string
  description?: string
  fields: ListingField[]
}

const APPLE_CATEGORIES = [
  'Sports',
  'Entertainment',
  'Lifestyle',
  'Music',
  'Social Networking',
  'Health & Fitness',
  'Education',
  'News',
  'Photo & Video',
  'Business',
]
const FREQ = ['None', 'Infrequent/Mild', 'Frequent/Intense']

export const STORE_LISTING_SECTIONS: ListingSection[] = [
  {
    title: 'App Store listing',
    fields: [
      { key: 'subtitle', label: 'Subtitle', kind: 'text', maxLength: 30, required: true, help: 'Up to 30 chars under the app name.' },
      { key: 'promotional_text', label: 'Promotional text', kind: 'textarea', maxLength: 170 },
      { key: 'description', label: 'Description', kind: 'textarea', maxLength: 4000, required: true },
      { key: 'keywords', label: 'Keywords', kind: 'text', maxLength: 100, required: true, help: 'Comma-separated, 100 chars total.' },
      { key: 'primary_category', label: 'Primary category', kind: 'select', options: APPLE_CATEGORIES, required: true },
      { key: 'secondary_category', label: 'Secondary category', kind: 'select', options: ['', ...APPLE_CATEGORIES] },
      { key: 'support_url', label: 'Support URL', kind: 'url', required: true },
      { key: 'marketing_url', label: 'Marketing URL', kind: 'url' },
      { key: 'privacy_policy_url', label: 'Privacy policy URL', kind: 'url', required: true },
      { key: 'copyright', label: 'Copyright', kind: 'text', help: 'e.g. 2026 Your Name' },
    ],
  },
  {
    title: 'Google Play listing',
    fields: [
      { key: 'short_description', label: 'Short description', kind: 'textarea', maxLength: 80, required: true },
      { key: 'full_description', label: 'Full description', kind: 'textarea', maxLength: 4000 },
      { key: 'play_category', label: 'Play category', kind: 'select', options: ['', 'Sports', 'Entertainment', 'Lifestyle', 'Music & Audio', 'Social', 'Health & Fitness', 'News & Magazines'] },
    ],
  },
  {
    title: 'Contact (App Store Connect)',
    fields: [
      { key: 'contact_first_name', label: 'First name', kind: 'text', required: true },
      { key: 'contact_last_name', label: 'Last name', kind: 'text', required: true },
      { key: 'contact_email', label: 'Email', kind: 'text', required: true },
      { key: 'contact_phone', label: 'Phone', kind: 'text', required: true },
      { key: 'contact_address', label: 'Address', kind: 'textarea' },
    ],
  },
  {
    title: 'Age rating',
    fields: [
      { key: 'made_for_kids', label: 'Made for kids', kind: 'checkbox' },
      { key: 'rating_violence', label: 'Cartoon / realistic violence', kind: 'select', options: FREQ },
      { key: 'rating_sexual', label: 'Sexual content / nudity', kind: 'select', options: FREQ },
      { key: 'rating_profanity', label: 'Profanity / crude humor', kind: 'select', options: FREQ },
      { key: 'rating_substances', label: 'Alcohol, tobacco, drugs', kind: 'select', options: FREQ },
      { key: 'rating_gambling', label: 'Simulated gambling', kind: 'select', options: FREQ },
      { key: 'rating_result', label: 'Resulting age rating', kind: 'text', help: 'e.g. 4+, 12+, 17+' },
    ],
  },
  {
    title: 'Privacy — data collected (nutrition labels)',
    description: 'Check every data type the app collects.',
    fields: [
      { key: 'data_contact_info', label: 'Contact info', kind: 'checkbox' },
      { key: 'data_identifiers', label: 'Identifiers (device/user IDs)', kind: 'checkbox' },
      { key: 'data_usage', label: 'Usage data', kind: 'checkbox' },
      { key: 'data_location', label: 'Location', kind: 'checkbox' },
      { key: 'data_purchases', label: 'Purchases', kind: 'checkbox' },
      { key: 'data_linked_to_user', label: 'Data is linked to the user', kind: 'checkbox' },
      { key: 'uses_tracking', label: 'Used for tracking across apps', kind: 'checkbox' },
    ],
  },
  {
    title: 'Store assets',
    fields: [
      { key: 'app_icon_1024', label: 'App icon (1024×1024)', kind: 'image', required: true },
      { key: 'screenshots_67', label: 'iPhone 6.7" screenshots', kind: 'images' },
      { key: 'screenshots_65', label: 'iPhone 6.5" screenshots', kind: 'images' },
      { key: 'screenshots_ipad', label: 'iPad 12.9" screenshots', kind: 'images' },
      { key: 'feature_graphic', label: 'Play feature graphic (1024×500)', kind: 'image' },
      { key: 'play_phone_screenshots', label: 'Play phone screenshots', kind: 'images' },
      { key: 'promo_video_url', label: 'Promo video URL', kind: 'url' },
    ],
  },
  {
    title: 'Pricing & compliance',
    fields: [
      { key: 'price_tier', label: 'Price', kind: 'select', options: ['Free', 'Paid'] },
      { key: 'availability', label: 'Availability (countries)', kind: 'text', help: 'e.g. United States, or "All countries".' },
      { key: 'uses_encryption', label: 'Uses non-exempt encryption', kind: 'checkbox' },
      { key: 'third_party_content', label: 'Contains third-party content (with rights)', kind: 'checkbox' },
    ],
  },
]

const REQUIRED_KEYS = STORE_LISTING_SECTIONS.flatMap((s) =>
  s.fields.filter((f) => f.required).map((f) => f.key)
)

export function listingCompleteness(
  listing: Record<string, unknown> | null | undefined
): { done: number; total: number; pct: number } {
  const l = listing ?? {}
  const total = REQUIRED_KEYS.length
  const done = REQUIRED_KEYS.filter((k) => {
    const v = l[k]
    if (Array.isArray(v)) return v.length > 0
    return typeof v === 'string' ? v.trim().length > 0 : Boolean(v)
  }).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 100 }
}
