/**
 * NILiance deep-link URL builders — ports of the legacy ez_niliance_*_external_url
 * helpers. Templates are env-configurable (prod vs staging host); defaults match
 * the legacy production templates.
 *
 *   listing/opportunity : https://niliance.com/l/{slug}/{id}
 *   talent profile      : https://niliance.com/l/{slug}/{uuid}
 *   brand listing edit  : https://niliance.com/l/{slug}/{uuid}/edit/details
 */
const LISTING_TPL =
  process.env.NILIANCE_LISTING_URL_TEMPLATE || 'https://niliance.com/l/{slug}/{id}'
const PROFILE_TPL =
  process.env.NILIANCE_PROFILE_URL_TEMPLATE || 'https://niliance.com/l/{slug}/{uuid}'
export const NILIANCE_HOME = process.env.NILIANCE_HOME || 'https://niliance.com'

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Opportunity (listing) URL → /l/{slug}/{id}. */
export function nilianceListingUrl(listing: {
  id?: string
  slug?: string
  title?: string
}): string {
  const id = listing.id ?? ''
  const slug = listing.slug || (listing.title ? slugify(listing.title) : '') || id
  return LISTING_TPL.replace('{id}', encodeURIComponent(id)).replace(
    '{slug}',
    encodeURIComponent(slug)
  )
}

/** Talent profile URL → /l/{slug}/{uuid} (NILiance uses the listing uuid; user
 *  uuid is the legacy fallback when no listing is synced). */
export function nilianceProfileUrl(slug: string, uuid: string): string {
  return PROFILE_TPL.replace('{slug}', encodeURIComponent(slug || uuid))
    .replace('{uuid}', encodeURIComponent(uuid))
    .replace('{id}', encodeURIComponent(uuid))
}

/** Brand listing-edit URL → /l/{slug}/{uuid}/edit/details (falls back to
 *  /profile-settings when the brand's listing isn't synced yet). */
export function nilianceEditUrl(slug?: string | null, uuid?: string | null): string {
  if (slug && uuid) {
    return `${NILIANCE_HOME}/l/${encodeURIComponent(slug)}/${encodeURIComponent(uuid)}/edit/details`
  }
  return `${NILIANCE_HOME}/profile-settings`
}
