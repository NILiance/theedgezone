/**
 * Maps a purchased product to the profile sections most relevant to building
 * it well. Powers the post-purchase "fill out these sections" recommendation
 * banner + email.
 */
export type ProfileSectionKey =
  | 'basics'
  | 'athletic'
  | 'brand'
  | 'story'
  | 'social'
  | 'contacts'
  | 'goals'

export const SECTION_LABELS: Record<ProfileSectionKey, string> = {
  basics: 'Basics',
  athletic: 'Athletic',
  brand: 'Brand',
  story: 'Story',
  social: 'Socials',
  contacts: 'Contacts',
  goals: 'Goals',
}

export const RECOMMENDED_SECTIONS_BY_SLUG: Record<string, ProfileSectionKey[]> = {
  'personal-website': ['basics', 'brand', 'story', 'social', 'athletic'],
  'electronic-press-kit': ['basics', 'story', 'athletic', 'social', 'contacts'],
  'personal-brand-design': ['basics', 'brand', 'athletic'],
  'brand-lite': ['brand'],
  'create-a-mobile-app': ['basics', 'brand', 'social'],
  'start-a-podcast': ['basics', 'brand', 'story'],
  'digital-business-cards': ['basics', 'contacts', 'social', 'brand'],
  'create-an-online-store': ['basics', 'brand', 'social'],
}

export function sectionsForSlug(slug: string): ProfileSectionKey[] {
  return RECOMMENDED_SECTIONS_BY_SLUG[slug] ?? ['basics', 'brand']
}
