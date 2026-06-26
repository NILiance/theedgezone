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
  | 'icon_picker'
  | 'dollars'

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
    defaultProps: {
      content: 'Write something compelling here.',
      alignment: 'left',
      max_width: '720px',
      text_color: '',
      font_size: 'base',
      font_weight: 'normal',
      font_family: 'body',
      line_height: 'relaxed',
      letter_spacing: 'normal',
      bg_color: '',
    },
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
          { value: 'justify', label: 'Justify' },
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
      { key: 'text_color', label: 'Text color (optional)', type: 'color' },
      { key: 'bg_color', label: 'Background color (optional)', type: 'color' },
      {
        key: 'font_size',
        label: 'Font size',
        type: 'select',
        options: [
          { value: 'xs', label: 'X-Small' },
          { value: 'sm', label: 'Small' },
          { value: 'base', label: 'Base (default)' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'X-Large' },
          { value: '2xl', label: '2XL' },
          { value: '3xl', label: '3XL' },
          { value: '4xl', label: '4XL' },
        ],
      },
      {
        key: 'font_weight',
        label: 'Font weight',
        type: 'select',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'normal', label: 'Regular (default)' },
          { value: 'medium', label: 'Medium' },
          { value: 'semibold', label: 'Semibold' },
          { value: 'bold', label: 'Bold' },
          { value: 'extrabold', label: 'Extra-bold' },
          { value: 'black', label: 'Black' },
        ],
      },
      {
        key: 'font_family',
        label: 'Font family',
        type: 'select',
        options: [
          { value: 'body', label: 'Body (default)' },
          { value: 'heading', label: 'Heading' },
          { value: 'mono', label: 'Monospace' },
          { value: 'serif', label: 'Serif' },
        ],
      },
      {
        key: 'line_height',
        label: 'Line height',
        type: 'select',
        options: [
          { value: 'tight', label: 'Tight' },
          { value: 'snug', label: 'Snug' },
          { value: 'normal', label: 'Normal' },
          { value: 'relaxed', label: 'Relaxed (default)' },
          { value: 'loose', label: 'Loose' },
        ],
      },
      {
        key: 'letter_spacing',
        label: 'Letter spacing',
        type: 'select',
        options: [
          { value: 'tighter', label: 'Tighter' },
          { value: 'tight', label: 'Tight' },
          { value: 'normal', label: 'Normal (default)' },
          { value: 'wide', label: 'Wide' },
          { value: 'wider', label: 'Wider' },
          { value: 'widest', label: 'Widest' },
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
    type: 'audio',
    label: 'Audio',
    icon: '♪',
    category: 'mysite',
    desc: 'Audio player for a track, mix, or interview.',
    defaultProps: { title: '', tracks: [{ title: '', url: '' }] },
    fields: [
      { key: 'title', label: 'Section title', type: 'text', placeholder: 'Listen' },
      {
        key: 'tracks',
        label: 'Tracks',
        type: 'repeater',
        itemFields: [
          { key: 'title', label: 'Track title', type: 'text' },
          { key: 'url', label: 'Audio URL (MP3/M4A)', type: 'url' },
        ],
        itemDefault: { title: '', url: '' },
      },
    ],
  },
  {
    type: 'press',
    label: 'Press / Media',
    icon: '📰',
    category: 'mysite',
    desc: 'Press hits, features, and media coverage.',
    defaultProps: {
      title: 'In the press',
      items: [{ outlet: '', headline: '', url: '', date: '', logo: '' }],
    },
    fields: [
      { key: 'title', label: 'Section title', type: 'text', placeholder: 'In the press' },
      {
        key: 'items',
        label: 'Press items',
        type: 'repeater',
        itemFields: [
          { key: 'outlet', label: 'Outlet', type: 'text', placeholder: 'ESPN' },
          { key: 'headline', label: 'Headline', type: 'text' },
          { key: 'url', label: 'Article URL', type: 'url' },
          { key: 'date', label: 'Date', type: 'text', placeholder: 'Mar 2026' },
          { key: 'logo', label: 'Outlet logo (optional)', type: 'image' },
        ],
        itemDefault: { outlet: '', headline: '', url: '', date: '', logo: '' },
      },
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
      bg_image: '',
      bg_overlay_color: '#000000',
      bg_overlay_opacity: 0.45,
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'textarea' },
      { key: 'button_text', label: 'Button label', type: 'text' },
      { key: 'button_url', label: 'Button URL', type: 'url' },
      { key: 'bg_color', label: 'Background color', type: 'color' },
      { key: 'text_color', label: 'Text color', type: 'color' },
      { key: 'bg_image', label: 'Background image', type: 'image' },
      { key: 'bg_overlay_color', label: 'Overlay color', type: 'color' },
      { key: 'bg_overlay_opacity', label: 'Overlay opacity', type: 'range', min: 0, max: 1, step: 0.05 },
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
        { icon: 'emoji:🏆', label: 'Career stat', value: '—', color: '' },
        { icon: 'emoji:📈', label: 'Followers', value: '—', color: '' },
        { icon: 'emoji:⭐', label: 'Engagement', value: '—', color: '' },
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
        key: 'value_size',
        label: 'Value size',
        type: 'select',
        options: [
          { value: 'sm', label: 'Small' },
          { value: 'base', label: 'Base' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'X-Large' },
          { value: '2xl', label: '2XL' },
          { value: '3xl', label: '3XL' },
          { value: '4xl', label: '4XL' },
          { value: '5xl', label: '5XL (default)' },
          { value: '6xl', label: '6XL' },
          { value: '7xl', label: '7XL' },
          { value: '8xl', label: '8XL' },
        ],
      },
      {
        key: 'value_weight',
        label: 'Value weight',
        type: 'select',
        options: [
          { value: 'normal', label: 'Regular' },
          { value: 'medium', label: 'Medium' },
          { value: 'semibold', label: 'Semibold' },
          { value: 'bold', label: 'Bold' },
          { value: 'extrabold', label: 'Extra-bold' },
          { value: 'black', label: 'Black (default)' },
        ],
      },
      {
        key: 'value_family',
        label: 'Value font',
        type: 'select',
        options: [
          { value: 'heading', label: 'Heading (default)' },
          { value: 'body', label: 'Body' },
          { value: 'mono', label: 'Monospace' },
        ],
      },
      {
        key: 'label_size',
        label: 'Label size',
        type: 'select',
        options: [
          { value: 'xs', label: 'X-Small (default)' },
          { value: 'sm', label: 'Small' },
          { value: 'base', label: 'Base' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'X-Large' },
        ],
      },
      {
        key: 'label_weight',
        label: 'Label weight',
        type: 'select',
        options: [
          { value: 'normal', label: 'Regular' },
          { value: 'medium', label: 'Medium' },
          { value: 'semibold', label: 'Semibold (default)' },
          { value: 'bold', label: 'Bold' },
        ],
      },
      {
        key: 'label_case',
        label: 'Label case',
        type: 'select',
        options: [
          { value: 'none', label: 'As-typed' },
          { value: 'uppercase', label: 'UPPERCASE (default)' },
          { value: 'capitalize', label: 'Capitalize' },
          { value: 'lowercase', label: 'lowercase' },
        ],
      },
      {
        key: 'label_tracking',
        label: 'Label letter spacing',
        type: 'select',
        options: [
          { value: 'tight', label: 'Tight' },
          { value: 'normal', label: 'Normal' },
          { value: 'wide', label: 'Wide' },
          { value: 'wider', label: 'Wider' },
          { value: 'widest', label: 'Widest (default)' },
        ],
      },
      {
        key: 'stats',
        label: 'Stats',
        type: 'repeater',
        itemFields: [
          { key: 'icon', label: 'Icon', type: 'icon_picker' },
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'color', label: 'Color (optional)', type: 'color' },
          { key: 'label_color', label: 'Label color (optional)', type: 'color' },
        ],
        itemDefault: { icon: 'emoji:🏆', value: '—', label: 'Stat', color: '', label_color: '' },
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
        { icon: 'emoji:🏆', label: 'State Champion', value: '2024', color: '' },
      ],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'badges',
        label: 'Badges',
        type: 'repeater',
        itemFields: [
          { key: 'icon', label: 'Icon', type: 'icon_picker' },
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'value', label: 'Year / detail', type: 'text' },
          { key: 'color', label: 'Color (optional)', type: 'color' },
        ],
        itemDefault: { icon: 'emoji:🏆', label: '', value: '', color: '' },
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

  // ── FOR MY FANS (19) ────────────────────────────────────────────────────
  {
    type: 'tip_jar',
    label: 'Tip jar',
    icon: '💸',
    category: 'fans',
    desc: 'Let fans send a one-time tip at preset amounts.',
    defaultProps: {
      title: 'Send a tip',
      description: 'Like what I do? Drop a tip — it goes straight to me.',
      amounts: [5, 10, 25, 50],
      allow_custom: true,
      currency: 'USD',
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      {
        key: 'amounts',
        label: 'Preset amounts',
        type: 'repeater',
        itemFields: [{ key: 'value', label: 'Amount', type: 'number', min: 1, max: 5000 }],
        itemDefault: { value: 10 },
      },
      { key: 'allow_custom', label: 'Allow custom amount', type: 'toggle' },
    ],
  },
  {
    type: 'fan_poll',
    label: 'Fan poll',
    icon: '🗳',
    category: 'fans',
    desc: 'Single-question poll. Show running results.',
    defaultProps: {
      title: '',
      question: 'What should I post next?',
      options: ['Behind-the-scenes', 'Training day', 'Q&A'],
      supporters_only: false,
    },
    fields: [
      { key: 'title', label: 'Title (optional)', type: 'text' },
      { key: 'question', label: 'Poll question', type: 'text' },
      {
        key: 'options',
        label: 'Options',
        type: 'repeater',
        itemFields: [{ key: 'text', label: 'Option text', type: 'text' }],
        itemDefault: { text: '' },
      },
      { key: 'supporters_only', label: 'Restrict to supporters', type: 'toggle' },
    ],
  },
  {
    type: 'guestbook',
    label: 'Guestbook',
    icon: '📓',
    category: 'fans',
    desc: 'Fans can leave a short signed note.',
    defaultProps: {
      title: 'Guestbook',
      description: 'Drop a line — let me know what brought you here.',
      moderation_required: false,
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'moderation_required', label: 'Hold entries for approval', type: 'toggle' },
    ],
  },
  {
    type: 'supporters_wall',
    label: 'Supporters wall',
    icon: '🧱',
    category: 'fans',
    desc: 'Wall of names + avatars of recent supporters.',
    defaultProps: { title: 'My supporters', description: '', limit: 30 },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'limit', label: 'Show last N', type: 'number', min: 5, max: 200 },
    ],
  },
  {
    type: 'fan_leaderboard',
    label: 'Fan leaderboard',
    icon: '🏆',
    category: 'fans',
    desc: 'Top supporters ranked by lifetime amount.',
    defaultProps: { title: 'Top supporters', limit: 10, show_amounts: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'limit', label: 'Show top N', type: 'number', min: 3, max: 50 },
      { key: 'show_amounts', label: 'Show amounts', type: 'toggle' },
    ],
  },
  {
    type: 'milestones',
    label: 'Milestones',
    icon: '🎯',
    category: 'fans',
    desc: 'Unlockable rewards at supporter-count thresholds.',
    defaultProps: {
      title: 'Milestones',
      milestones: [
        { target: 100, title: 'First 100 supporters', reward: 'Custom thank-you video' },
        { target: 500, title: '500 supporters', reward: 'Behind-the-scenes drop' },
        { target: 1000, title: '1,000 supporters', reward: 'Live group hangout' },
      ],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'milestones',
        label: 'Milestones',
        type: 'repeater',
        itemFields: [
          { key: 'target', label: 'Supporter count', type: 'number', min: 1, max: 1000000 },
          { key: 'title', label: 'Milestone name', type: 'text' },
          { key: 'reward', label: 'Reward', type: 'text' },
        ],
        itemDefault: { target: 100, title: '', reward: '' },
      },
    ],
  },
  {
    type: 'supporter_streak',
    label: 'Supporter streak',
    icon: '🔥',
    category: 'fans',
    desc: 'Highlights longest active supporters.',
    defaultProps: { title: 'Longest streaks' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'content_drip',
    label: 'Content drip',
    icon: '⏰',
    category: 'fans',
    desc: 'Tier-gated drip of scheduled content.',
    defaultProps: { title: 'Members-only drops' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'referral',
    label: 'Referral',
    icon: '🤝',
    category: 'fans',
    desc: 'Generates a unique referral link for sharing.',
    defaultProps: {
      title: 'Refer a friend',
      description: 'Share my page and earn a reward when they support.',
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    type: 'activity_feed',
    label: 'Activity feed',
    icon: '⚡',
    category: 'fans',
    desc: 'Live stream of recent supports / signups / messages.',
    defaultProps: { title: 'Latest activity', limit: 20 },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'limit', label: 'Items', type: 'number', min: 5, max: 50 },
    ],
  },
  {
    type: 'revenue_ticker',
    label: 'Revenue ticker',
    icon: '🪙',
    category: 'fans',
    desc: 'Animated counter of total lifetime support raised.',
    defaultProps: { label: 'Raised so far', currency: 'USD' },
    fields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'currency', label: 'Currency code', type: 'text' },
    ],
  },
  {
    type: 'fan_portal',
    label: 'Fan portal',
    icon: '🎟',
    category: 'fans',
    desc: 'Logged-in supporter dashboard widget — orders, rewards, membership.',
    defaultProps: {
      title: 'My account',
      show_rewards: true,
      show_orders: true,
      show_membership: true,
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'show_rewards', label: 'Show unlocked rewards', type: 'toggle' },
      { key: 'show_orders', label: 'Show order history', type: 'toggle' },
      { key: 'show_membership', label: 'Show membership status', type: 'toggle' },
    ],
  },
  {
    type: 'my_purchases',
    label: 'My purchases',
    icon: '🧾',
    category: 'fans',
    desc: 'Supporter-only — fan’s own purchase history.',
    defaultProps: { title: 'My purchases' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'my_rewards',
    label: 'My rewards',
    icon: '🎁',
    category: 'fans',
    desc: 'Supporter-only — fan’s unlocked rewards.',
    defaultProps: { title: 'My rewards' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'my_card',
    label: 'My supporter card',
    icon: '🪪',
    category: 'fans',
    desc: 'Supporter-only — fan’s personalized supporter card.',
    defaultProps: { title: 'Supporter card' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'my_membership',
    label: 'My membership',
    icon: '⭐',
    category: 'fans',
    desc: 'Supporter-only — fan’s membership status + manage.',
    defaultProps: { title: 'My membership' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'my_activity',
    label: 'My activity',
    icon: '📊',
    category: 'fans',
    desc: 'Supporter-only — fan’s lifetime support summary.',
    defaultProps: { title: 'My activity' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'my_referrals',
    label: 'My referrals',
    icon: '🔁',
    category: 'fans',
    desc: 'Supporter-only — fan’s referral link + stats.',
    defaultProps: { title: 'My referrals' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'gift_tip',
    label: 'Gift a tip',
    icon: '🎀',
    category: 'fans',
    desc: 'Lets a supporter tip on behalf of someone else.',
    defaultProps: {
      title: 'Gift a tip',
      description: 'Tip on behalf of a friend — they’ll get the credit.',
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    type: 'rewards_showcase',
    label: 'Rewards showcase',
    icon: '✨',
    category: 'fans',
    desc: 'Public preview of available supporter rewards.',
    defaultProps: { title: 'Rewards you can unlock' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },

  // ── REVENUE (3) ──────────────────────────────────────────────────────────
  {
    type: 'merch',
    label: 'Merch',
    icon: '👕',
    category: 'revenue',
    desc: 'Catalog of merch products. Manage in Merch tab.',
    defaultProps: { title: 'Shop merch' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  },
  {
    type: 'shoutout_request',
    label: 'Shoutout request',
    icon: '📣',
    category: 'revenue',
    desc: 'Paid personalized shoutouts. Cameo-style.',
    defaultProps: {
      title: 'Get a personalized shoutout',
      description: 'I’ll record a video for you, your friend, or your team.',
      price_cents: 5000,
      delivery_days: 7,
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price_cents', label: 'Price', type: 'dollars', min: 100, max: 1000000 },
      { key: 'delivery_days', label: 'Delivery time (days)', type: 'number', min: 1, max: 60 },
    ],
  },
  {
    type: 'membership_tiers',
    label: 'Membership tiers',
    icon: '🎫',
    category: 'revenue',
    desc: 'Recurring memberships. Manage tiers in Membership Tiers tab.',
    defaultProps: { title: 'Join the membership' },
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
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
