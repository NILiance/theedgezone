/**
 * EPK starter templates. Each seeds a theme + an ordered block set. The apply
 * action merges each block's overrides over defaultPropsFor(type), so the EPK
 * renders meaningfully right after applying.
 */

export interface EpkTemplateBlock {
  type: string
  props?: Record<string, unknown>
}

export interface EpkTemplate {
  id: string
  name: string
  desc: string
  theme: { primary: string; secondary: string; mode: 'dark' | 'light'; font_heading: string }
  blocks: EpkTemplateBlock[]
}

export const EPK_TEMPLATES: EpkTemplate[] = [
  {
    id: 'spotlight',
    name: 'Spotlight',
    desc: 'Bold, dark, stats-forward. Great default for athletes.',
    theme: { primary: '#C8A84E', secondary: '#0a0a0a', mode: 'dark', font_heading: 'Inter' },
    blocks: [
      { type: 'hero', props: { heading: 'Your Name', subheading: 'Sport · School · Class of 20XX' } },
      { type: 'stats', props: { title: 'By the numbers' } },
      { type: 'video', props: { title: 'Highlight reel' } },
      { type: 'press', props: { title: 'In the press' } },
      { type: 'sponsors', props: { title: 'Partners' } },
      { type: 'contact_form', props: { title: 'Work with me' } },
    ],
  },
  {
    id: 'press-ready',
    name: 'Press-Ready',
    desc: 'Clean, light, editorial. Built for media + journalists.',
    theme: { primary: '#1a1a1a', secondary: '#ffffff', mode: 'light', font_heading: 'Georgia, serif' },
    blocks: [
      { type: 'hero', props: { heading: 'Your Name', subheading: 'The press kit' } },
      { type: 'text', props: { content: '<p>Your bio goes here — who you are, what you play, and what you stand for.</p>' } },
      { type: 'press', props: { title: 'Coverage' } },
      { type: 'gallery', props: { title: 'Photos' } },
      { type: 'achievements', props: { title: 'Achievements' } },
      { type: 'contact_form', props: { title: 'Media inquiries' } },
    ],
  },
  {
    id: 'highlight-reel',
    name: 'Highlight Reel',
    desc: 'Video-forward and energetic. Lead with your tape.',
    theme: { primary: '#e74c3c', secondary: '#0a0a0a', mode: 'dark', font_heading: '"Arial Narrow", system-ui, sans-serif' },
    blocks: [
      { type: 'hero', props: { heading: 'Your Name', subheading: 'Watch the tape' } },
      { type: 'video', props: { title: 'Highlights' } },
      { type: 'gallery', props: { title: 'Gallery' } },
      { type: 'stats', props: { title: 'Stats' } },
      { type: 'audio', props: { title: 'Listen' } },
      { type: 'social_feed', props: {} },
      { type: 'contact_form', props: { title: 'Get in touch' } },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Light, simple, link-in-bio style. Fast to fill out.',
    theme: { primary: '#0a0a0a', secondary: '#fafafa', mode: 'light', font_heading: 'system-ui' },
    blocks: [
      { type: 'hero', props: { heading: 'Your Name', subheading: 'Sport · School' } },
      { type: 'text', props: { content: '<p>A sentence or two about you.</p>' } },
      { type: 'links', props: { title: 'Find me' } },
      { type: 'contact_form', props: { title: 'Contact' } },
    ],
  },
]

export function epkTemplate(id: string): EpkTemplate | undefined {
  return EPK_TEMPLATES.find((t) => t.id === id)
}
