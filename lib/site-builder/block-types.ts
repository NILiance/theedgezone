/**
 * Block type registry — matches legacy `nil_sb_block_types()` (PHP line 293).
 * Each block has a label, category, description, default props, and field
 * spec used by the editor form. Field types map to the BlockField renderer
 * in components/site/editor/block-field.tsx.
 */

export type BlockCategory = 'mysite' | 'fans' | 'revenue'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'url'
  | 'email'
  | 'phone'
  | 'color'
  | 'image'
  | 'select'
  | 'toggle'
  | 'range'
  | 'datetime'
  | 'json'
  | 'repeater'

export interface FieldSpec {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  help?: string
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  step?: number
  default?: unknown
  /** For repeater fields: schema of each item */
  itemFields?: FieldSpec[]
  /** For repeater fields: default new item */
  itemDefault?: Record<string, unknown>
}

export interface BlockTypeDef {
  type: string
  label: string
  icon: string
  category: BlockCategory
  desc: string
  defaultProps: Record<string, unknown>
  fields: FieldSpec[]
}

/** All 26 "My Site" blocks from the legacy registry. */
export const BLOCK_TYPES: BlockTypeDef[] = [
  // ── Foundational ────────────────────────────────────────────────────────
  {
    type: 'hero',
    label: 'Hero',
    icon: '◓',
    category: 'mysite',
    desc: 'Full-bleed banner with heading, subhead, CTA.',
    defaultProps: {
      heading: 'Your Name',
      subheading: 'Brief tagline that captures who you are.',
      bg_image: '',
      bg_position: 'center center',
      cta_text: '',
      cta_url: '',
      overlay_color: '#000000',
      overlay_opacity: 0.4,
      height: '70vh',
      text_align: 'center',
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'textarea' },
      { key: 'bg_image', label: 'Background image URL', type: 'image' },
      {
        key: 'bg_position',
        label: 'Background position',
        type: 'select',
        options: [
          { value: 'center center', label: 'Center' },
          { value: 'top center', label: 'Top' },
          { value: 'bottom center', label: 'Bottom' },
          { value: 'center left', label: 'Left' },
          { value: 'center right', label: 'Right' },
        ],
      },
      { key: 'cta_text', label: 'CTA button text', type: 'text' },
      { key: 'cta_url', label: 'CTA button URL', type: 'url' },
      { key: 'overlay_color', label: 'Overlay color', type: 'color' },
      { key: 'overlay_opacity', label: 'Overlay opacity', type: 'range', min: 0, max: 1, step: 0.05 },
      {
        key: 'height',
        label: 'Height',
        type: 'select',
        options: [
          { value: '50vh', label: 'Short (50vh)' },
          { value: '70vh', label: 'Medium (70vh)' },
          { value: '100vh', label: 'Full screen (100vh)' },
          { value: '400px', label: '400px' },
          { value: '600px', label: '600px' },
        ],
      },
      {
        key: 'text_align',
        label: 'Text alignment',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
    ],
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: '𝐇',
    category: 'mysite',
    desc: 'Section heading (H1–H4).',
    defaultProps: { content: 'Section heading', size: 'h2', alignment: 'left' },
    fields: [
      { key: 'content', label: 'Heading text', type: 'text' },
      {
        key: 'size',
        label: 'Size',
        type: 'select',
        options: [
          { value: 'h1', label: 'H1' },
          { value: 'h2', label: 'H2' },
          { value: 'h3', label: 'H3' },
          { value: 'h4', label: 'H4' },
        ],
      },
      {
        key: 'alignment',
        label: 'Alignment',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
    ],
  },
  {
    type: 'text',
    label: 'Text',
    icon: '¶',
    category: 'mysite',
    desc: 'Rich text paragraph.',
    defaultProps: { content: 'Write something compelling here.', alignment: 'left', max_width: '720px' },
    fields: [
      { key: 'content', label: 'Body', type: 'richtext' },
      {
        key: 'alignment',
        label: 'Alignment',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
      {
        key: 'max_width',
        label: 'Max width',
        type: 'select',
        options: [
          { value: '560px', label: 'Narrow' },
          { value: '720px', label: 'Medium' },
          { value: '960px', label: 'Wide' },
          { value: '100%', label: 'Full width' },
        ],
      },
    ],
  },
  {
    type: 'image',
    label: 'Image',
    icon: '🖼',
    category: 'mysite',
    desc: 'Single image with caption.',
    defaultProps: { url: '', alt: '', caption: '', max_width: '960px', alignment: 'center', border_radius: 8 },
    fields: [
      { key: 'url', label: 'Image URL', type: 'image' },
      { key: 'alt', label: 'Alt text', type: 'text' },
      { key: 'caption', label: 'Caption', type: 'text' },
      {
        key: 'max_width',
        label: 'Max width',
        type: 'select',
        options: [
          { value: '480px', label: 'Small' },
          { value: '720px', label: 'Medium' },
          { value: '960px', label: 'Large' },
          { value: '100%', label: 'Full width' },
        ],
      },
      {
        key: 'alignment',
        label: 'Alignment',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
      { key: 'border_radius', label: 'Corner radius (px)', type: 'number', min: 0, max: 50 },
    ],
  },
  {
    type: 'gallery',
    label: 'Gallery',
    icon: '▦',
    category: 'mysite',
    desc: 'Grid of images.',
    defaultProps: { title: '', columns: 3, images: [], lightbox: true, style: 'grid' },
    fields: [
      { key: 'title', label: 'Title (optional)', type: 'text' },
      { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 6 },
      {
        key: 'style',
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'grid', label: 'Grid' },
          { value: 'fullwidth', label: 'Full width' },
        ],
      },
      { key: 'lightbox', label: 'Enable lightbox', type: 'toggle' },
      {
        key: 'images',
        label: 'Images',
        type: 'repeater',
        itemFields: [
          { key: 'url', label: 'URL', type: 'image' },
          { key: 'alt', label: 'Alt', type: 'text' },
        ],
        itemDefault: { url: '', alt: '' },
      },
    ],
  },
  {
    type: 'video',
    label: 'Video',
    icon: '▶',
    category: 'mysite',
    desc: 'YouTube or Vimeo embed.',
    defaultProps: { url: '', title: '', aspect_ratio: '16/9', autoplay: false },
    fields: [
      { key: 'url', label: 'Video URL', type: 'url', placeholder: 'https://www.youtube.com/watch?v=…' },
      { key: 'title', label: 'Title (optional)', type: 'text' },
      {
        key: 'aspect_ratio',
        label: 'Aspect ratio',
        type: 'select',
        options: [
          { value: '16/9', label: '16:9' },
          { value: '4/3', label: '4:3' },
          { value: '1/1', label: '1:1' },
          { value: '9/16', label: '9:16 (vertical)' },
        ],
      },
      { key: 'autoplay', label: 'Autoplay', type: 'toggle' },
    ],
  },
  {
    type: 'cta',
    label: 'Call to action',
    icon: '⮕',
    category: 'mysite',
    desc: 'Heading + button to drive a single action.',
    defaultProps: {
      heading: 'Ready to work together?',
      subheading: 'Let me know how I can help your brand.',
      button_text: 'Contact me',
      button_url: '#contact',
      bg_color: '#0a0a0a',
      text_color: '#ffffff',
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'textarea' },
      { key: 'button_text', label: 'Button label', type: 'text' },
      { key: 'button_url', label: 'Button URL', type: 'url' },
      { key: 'bg_color', label: 'Background color', type: 'color' },
      { key: 'text_color', label: 'Text color', type: 'color' },
    ],
  },

  // ── Repeater-based ──────────────────────────────────────────────────────
  {
    type: 'faq',
    label: 'FAQ',
    icon: '?',
    category: 'mysite',
    desc: 'Frequently asked questions list.',
    defaultProps: {
      title: 'Frequently asked',
      items: [
        { question: 'How can brands work with you?', answer: 'Reach out via the contact section.' },
      ],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'items',
        label: 'Questions',
        type: 'repeater',
        itemFields: [
          { key: 'question', label: 'Question', type: 'text' },
          { key: 'answer', label: 'Answer', type: 'textarea' },
        ],
        itemDefault: { question: '', answer: '' },
      },
    ],
  },
  {
    type: 'stats',
    label: 'Stats',
    icon: '📊',
    category: 'mysite',
    desc: 'Key stats / numbers row.',
    defaultProps: {
      title: '',
      layout: 'cards',
      bg_color: '',
      text_color: '',
      stats: [
        { icon: '🏆', label: 'Career stat', value: '—', color: '' },
        { icon: '📈', label: 'Followers', value: '—', color: '' },
        { icon: '⭐', label: 'Engagement', value: '—', color: '' },
      ],
    },
    fields: [
      { key: 'title', label: 'Title (optional)', type: 'text' },
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'cards', label: 'Cards' },
          { value: 'bar', label: 'Horizontal bar' },
          { value: 'minimal', label: 'Minimal' },
          { value: 'counters', label: 'Animated counters' },
          { value: 'table', label: 'Table' },
          { value: 'detailed', label: 'Detailed' },
        ],
      },
      { key: 'bg_color', label: 'Background color', type: 'color' },
      { key: 'text_color', label: 'Text color', type: 'color' },
      {
        key: 'stats',
        label: 'Stats',
        type: 'repeater',
        itemFields: [
          { key: 'icon', label: 'Icon / emoji', type: 'text' },
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'color', label: 'Color (optional)', type: 'color' },
        ],
        itemDefault: { icon: '🏆', value: '—', label: 'Stat', color: '' },
      },
    ],
  },
  {
    type: 'achievements',
    label: 'Achievements',
    icon: '🏅',
    category: 'mysite',
    desc: 'Badges / awards grid.',
    defaultProps: {
      title: 'Achievements',
      badges: [
        { icon: '🏆', label: 'State Champion', value: '2024', color: '' },
      ],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'badges',
        label: 'Badges',
        type: 'repeater',
        itemFields: [
          { key: 'icon', label: 'Icon / emoji', type: 'text' },
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'value', label: 'Year / detail', type: 'text' },
          { key: 'color', label: 'Color (optional)', type: 'color' },
        ],
        itemDefault: { icon: '🏆', label: '', value: '', color: '' },
      },
    ],
  },
  {
    type: 'testimonial',
    label: 'Testimonials',
    icon: '“',
    category: 'mysite',
    desc: 'Quotes from coaches, sponsors, fans.',
    defaultProps: {
      title: 'What they say',
      testimonials: [
        { name: 'Coach Smith', role: 'Head coach', quote: 'A leader on and off the field.' },
      ],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'testimonials',
        label: 'Testimonials',
        type: 'repeater',
        itemFields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'role', label: 'Role', type: 'text' },
          { key: 'quote', label: 'Quote', type: 'textarea' },
        ],
        itemDefault: { name: '', role: '', quote: '' },
      },
    ],
  },
  {
    type: 'sponsors',
    label: 'Sponsors',
    icon: '🤝',
    category: 'mysite',
    desc: 'Logo wall of sponsors / partners.',
    defaultProps: { title: 'Partners', columns: 4, sponsors: [] },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns', type: 'number', min: 2, max: 6 },
      {
        key: 'sponsors',
        label: 'Sponsors',
        type: 'repeater',
        itemFields: [
          { key: 'name', label: 'Sponsor name', type: 'text' },
          { key: 'logo', label: 'Logo URL', type: 'image' },
        ],
        itemDefault: { name: '', logo: '' },
      },
    ],
  },
  {
    type: 'links',
    label: 'Links (linktree)',
    icon: '🔗',
    category: 'mysite',
    desc: 'Linktree-style stacked link list.',
    defaultProps: {
      title: 'Find me online',
      subtitle: '',
      style: 'rounded',
      open_new_tab: true,
      links: [{ label: 'Instagram', url: '' }, { label: 'TikTok', url: '' }],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        key: 'style',
        label: 'Button style',
        type: 'select',
        options: [
          { value: 'rounded', label: 'Rounded' },
          { value: 'pill', label: 'Pill' },
          { value: 'square', label: 'Square' },
          { value: 'underline', label: 'Underline' },
        ],
      },
      { key: 'open_new_tab', label: 'Open in new tab', type: 'toggle' },
      {
        key: 'links',
        label: 'Links',
        type: 'repeater',
        itemFields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'url', label: 'URL', type: 'url' },
        ],
        itemDefault: { label: '', url: '' },
      },
    ],
  },
  {
    type: 'schedule',
    label: 'Schedule',
    icon: '📅',
    category: 'mysite',
    desc: 'Upcoming events / games / appearances.',
    defaultProps: { title: 'Schedule', events: [{ date: '', time: '', title: '', location: '', description: '' }] },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'events',
        label: 'Events',
        type: 'repeater',
        itemFields: [
          { key: 'date', label: 'Date', type: 'text' },
          { key: 'time', label: 'Time', type: 'text' },
          { key: 'title', label: 'Event title', type: 'text' },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
        itemDefault: { date: '', time: '', title: '', location: '', description: '' },
      },
    ],
  },

  // ── Forms / engagement ──────────────────────────────────────────────────
  {
    type: 'contact_form',
    label: 'Contact form',
    icon: '✉',
    category: 'mysite',
    desc: 'Inquiry form with configurable fields. Submissions are stored.',
    defaultProps: {
      title: 'Get in touch',
      submit_text: 'Send message',
      fields: ['name', 'email', 'subject', 'message'],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'submit_text', label: 'Submit button text', type: 'text' },
      {
        key: 'fields',
        label: 'Fields',
        type: 'repeater',
        itemFields: [{ key: 'name', label: 'Field', type: 'text' }],
        itemDefault: { name: 'name' },
      },
    ],
  },
  {
    type: 'email_capture',
    label: 'Email capture',
    icon: '@',
    category: 'mysite',
    desc: 'Newsletter signup. Subscribers stored.',
    defaultProps: {
      title: 'Join my newsletter',
      description: 'Updates on games, partnerships, and behind-the-scenes content.',
      button_text: 'Subscribe',
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'button_text', label: 'Button text', type: 'text' },
    ],
  },

  // ── Time / events ───────────────────────────────────────────────────────
  {
    type: 'event_countdown',
    label: 'Event countdown',
    icon: '⏳',
    category: 'mysite',
    desc: 'Counts down to a specific event.',
    defaultProps: { title: '', event_name: '', event_date: '', event_url: '', description: '' },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'event_name', label: 'Event name', type: 'text' },
      { key: 'event_date', label: 'Event date', type: 'datetime' },
      { key: 'event_url', label: 'Event URL', type: 'url' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    type: 'countdown',
    label: 'Countdown',
    icon: '⏱',
    category: 'mysite',
    desc: 'Generic countdown timer.',
    defaultProps: { title: '', target_date: '', complete_message: 'It’s time!' },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'target_date', label: 'Target date', type: 'datetime' },
      { key: 'complete_message', label: 'Message when complete', type: 'text' },
    ],
  },

  // ── Embeds / integrations ───────────────────────────────────────────────
  {
    type: 'booking',
    label: 'Booking',
    icon: '📆',
    category: 'mysite',
    desc: 'Calendly or similar embedded scheduler.',
    defaultProps: { embed_url: '' },
    fields: [
      { key: 'embed_url', label: 'Calendly URL', type: 'url', placeholder: 'https://calendly.com/…' },
    ],
  },
  {
    type: 'map',
    label: 'Map',
    icon: '📍',
    category: 'mysite',
    desc: 'Embedded map (Google Maps embed code).',
    defaultProps: { embed_code: '' },
    fields: [
      { key: 'embed_code', label: 'Map embed HTML', type: 'textarea', placeholder: '<iframe …>' },
    ],
  },
  {
    type: 'social_feed',
    label: 'Social feed',
    icon: '🌀',
    category: 'mysite',
    desc: 'Pulls from your social handles. Shows quick links + counts.',
    defaultProps: { style: 'icons', show_counts: false },
    fields: [
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { value: 'icons', label: 'Icon row' },
          { value: 'cards', label: 'Cards' },
        ],
      },
      { key: 'show_counts', label: 'Show follower counts', type: 'toggle' },
    ],
  },
  {
    type: 'social_embed',
    label: 'Social embed',
    icon: '📲',
    category: 'mysite',
    desc: 'Embed a single Instagram, TikTok, or YouTube post.',
    defaultProps: { title: '', platform: 'instagram', embed_url: '', embed_code: '' },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'platform',
        label: 'Platform',
        type: 'select',
        options: [
          { value: 'instagram', label: 'Instagram' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'youtube', label: 'YouTube' },
          { value: 'twitter', label: 'X / Twitter' },
        ],
      },
      { key: 'embed_url', label: 'Post URL', type: 'url' },
      { key: 'embed_code', label: 'Raw embed code (advanced)', type: 'textarea' },
    ],
  },
  {
    type: 'blog_feed',
    label: 'Blog feed',
    icon: '📰',
    category: 'mysite',
    desc: 'Lists your latest blog posts.',
    defaultProps: { title: 'Recent posts', posts_per_page: 6, show_excerpt: true, show_date: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'posts_per_page', label: 'Posts per page', type: 'number', min: 1, max: 24 },
      { key: 'show_excerpt', label: 'Show excerpt', type: 'toggle' },
      { key: 'show_date', label: 'Show date', type: 'toggle' },
    ],
  },

  // ── Layout / utility ────────────────────────────────────────────────────
  {
    type: 'columns',
    label: 'Columns',
    icon: '▥',
    category: 'mysite',
    desc: 'Multi-column container holding sub-blocks.',
    defaultProps: {
      column_count: 2,
      column_data: [
        { blocks: [] },
        { blocks: [] },
      ],
    },
    fields: [
      { key: 'column_count', label: 'Column count', type: 'number', min: 2, max: 4 },
      { key: 'column_data', label: 'Columns (raw JSON)', type: 'json' },
    ],
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: '↕',
    category: 'mysite',
    desc: 'Vertical whitespace between blocks.',
    defaultProps: { height: 48 },
    fields: [{ key: 'height', label: 'Height (px)', type: 'number', min: 4, max: 400 }],
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: '—',
    category: 'mysite',
    desc: 'Horizontal rule.',
    defaultProps: {},
    fields: [],
  },
  {
    type: 'html',
    label: 'Raw HTML',
    icon: '<>',
    category: 'mysite',
    desc: 'Custom HTML (advanced).',
    defaultProps: { content: '<p>Custom HTML here.</p>' },
    fields: [{ key: 'content', label: 'HTML', type: 'textarea' }],
  },
  {
    type: 'navigation',
    label: 'Inline navigation',
    icon: '☰',
    category: 'mysite',
    desc: 'Renders the site nav inline in the page body.',
    defaultProps: { nav_type: 'main', stacked: false, title: '' },
    fields: [
      { key: 'title', label: 'Title (optional)', type: 'text' },
      {
        key: 'nav_type',
        label: 'Nav source',
        type: 'select',
        options: [
          { value: 'main', label: 'Main nav' },
          { value: 'footer', label: 'Footer nav' },
        ],
      },
      { key: 'stacked', label: 'Stacked layout', type: 'toggle' },
    ],
  },
]

/** Lookup table keyed by `type`. */
export const BLOCK_TYPES_BY_KEY: Record<string, BlockTypeDef> = Object.fromEntries(
  BLOCK_TYPES.map((b) => [b.type, b])
)

export function defaultPropsFor(type: string): Record<string, unknown> {
  return BLOCK_TYPES_BY_KEY[type]?.defaultProps ?? {}
}

export function fieldsFor(type: string): FieldSpec[] {
  return BLOCK_TYPES_BY_KEY[type]?.fields ?? []
}
