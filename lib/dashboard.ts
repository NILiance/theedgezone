import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SERVICES } from '@/lib/services-data'
import type { ProfileSectionKey } from '@/lib/profile-sections-by-product'

export interface DashboardProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  user_type: 'talent' | 'brand' | 'agency' | 'school' | 'parent' | 'fan' | 'staff' | null
  niliance_banner_dismissed_at: string | null
  nil_readiness_score: number
  profile_completion_pct: number
  points: number
  niliance_user_id: string | null
  niliance_synced_at: string | null
}

export interface DashboardOrder {
  id: string
  product_slug: string
  product_title: string
  plan: string | null
  amount_cents: number | null
  status: string
  purchased_at: string
  crm_synced_at: string | null
  provisioned_entity_id: string | null
  /** Thumbnail for the dashboard card — final_logo_url for brand
   *  designs, cover image for sites. Null until provisioned. */
  thumbnail_url: string | null
}

// Maps a product_slug to the underlying entity table whose row backs
// the dashboard card. When admin deletes a row from that table without
// also deleting the order, the order becomes an orphan — we skip it
// here so the user doesn't see a "ready" card linking to a 404.
const ORDER_ENTITY_TABLE: Record<string, 'brand_designs' | 'sites'> = {
  'personal-brand-design': 'brand_designs',
  'brand-lite': 'brand_designs',
  'personal-website': 'sites',
}

export const getDashboardData = cache(async (userId: string) => {
  const supabase = await createClient()

  const [profileRes, ordersRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, display_name, avatar_url, user_type, niliance_banner_dismissed_at, nil_readiness_score, profile_completion_pct, points, niliance_user_id, niliance_synced_at'
      )
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('orders')
      .select(
        'id, product_slug, product_title, plan, amount_cents, status, purchased_at, crm_synced_at, provisioned_entity_id'
      )
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
      .limit(50),
  ])

  const profile = (profileRes.data ?? null) as DashboardProfile | null
  const rawOrders = (ordersRes.data ?? []) as DashboardOrder[]

  // Group the orphan check by target table so we can ask Postgres for
  // existence once per table instead of once per order.
  const idsByTable = new Map<'brand_designs' | 'sites', string[]>()
  for (const o of rawOrders) {
    const table = ORDER_ENTITY_TABLE[o.product_slug]
    if (!table || !o.provisioned_entity_id) continue
    const list = idsByTable.get(table) ?? []
    list.push(o.provisioned_entity_id)
    idsByTable.set(table, list)
  }

  const existsByTable = new Map<'brand_designs' | 'sites', Set<string>>()
  // Per-entity thumbnail map so product cards can show the final logo /
  // site cover next to "READY" status.
  const thumbByEntityId = new Map<string, string>()
  await Promise.all(
    Array.from(idsByTable.entries()).map(async ([table, ids]) => {
      if (table === 'brand_designs') {
        const { data } = await supabase
          .from('brand_designs')
          .select('id, final_logo_url')
          .in('id', ids)
        existsByTable.set(table, new Set((data ?? []).map((r) => r.id as string)))
        for (const r of data ?? []) {
          if ((r as { final_logo_url?: string | null }).final_logo_url) {
            thumbByEntityId.set(r.id as string, (r as { final_logo_url: string }).final_logo_url)
          }
        }
      } else if (table === 'sites') {
        const { data } = await supabase.from('sites').select('id').in('id', ids)
        existsByTable.set(table, new Set((data ?? []).map((r) => r.id as string)))
        // Sites don't have a single canonical thumbnail field yet — leave
        // thumbnail_url null for those orders.
      }
    })
  )

  const orders = rawOrders
    .filter((o) => {
      const table = ORDER_ENTITY_TABLE[o.product_slug]
      if (!table) return true // slugs we don't have orphan-checking for
      if (!o.provisioned_entity_id) return true // not yet provisioned — keep
      return existsByTable.get(table)?.has(o.provisioned_entity_id) ?? false
    })
    .map((o) => ({
      ...o,
      thumbnail_url: o.provisioned_entity_id
        ? thumbByEntityId.get(o.provisioned_entity_id) ?? null
        : null,
    }))

  return { profile, orders }
})

/**
 * Computes per-section completion percentages from a profile row.
 * Same logic the profile editor uses — extracted here so the dashboard
 * banner can reuse it without re-loading the profile.
 */
export async function getProfileSectionPercents(
  userId: string
): Promise<Partial<Record<ProfileSectionKey, number>>> {
  const supabase = await createClient()
  const { data: p } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (!p) return {}
  const socials = (p.socials as Record<string, string> | null) ?? {}

  const filled = (xs: unknown[]) =>
    xs.filter((v) => v !== null && v !== undefined && v !== '').length
  const pct = (filled: number, total: number) =>
    total === 0 ? 0 : Math.round((filled / total) * 100)

  const basics = [p.display_name, p.phone, p.street_address, p.city, p.us_state, p.website_url, p.weight_lbs, p.hometown, p.height_inches, p.avatar_url]
  const athletic = [p.sport, p.athletic_position, p.school, p.conference, p.division, p.jersey_number, p.date_of_birth]
  const brand = [p.brand_primary_color, p.brand_secondary_color, p.brand_tagline, p.brand_voice]
  const story = [p.bio, p.achievements]
  const social = ['instagram', 'tiktok', 'twitter', 'youtube'].map((k) => socials[k])
  const contacts = [p.agency_name, p.agent_name, p.agent_email, p.agent_phone]
  const goalsFilled = ((p.selected_goals as string[]) ?? []).length

  return {
    basics: pct(filled(basics), basics.length),
    athletic: pct(filled(athletic), athletic.length),
    brand: pct(filled(brand), brand.length),
    story: pct(filled(story), story.length),
    social: pct(filled(social), social.length),
    contacts: pct(filled(contacts), contacts.length),
    goals: goalsFilled > 0 ? Math.min(100, goalsFilled * 20) : 0,
  }
}

/**
 * Maps NIL readiness score to an encouraging tier label. We avoid letter
 * grades (especially "F") so partial-profile athletes aren't told they're
 * failing — they're early in the journey.
 */
export function readinessGrade(score: number): string {
  if (score >= 93) return 'NIL READY'
  if (score >= 80) return 'STRONG'
  if (score >= 67) return 'PROMISING'
  if (score >= 50) return 'IN PROGRESS'
  if (score >= 30) return 'GETTING STARTED'
  return 'JUST BEGINNING'
}

/** Optional short coaching note that pairs with the tier label. */
export function readinessHint(score: number): string {
  if (score >= 93) return 'You’re positioned for top NIL deals.'
  if (score >= 80) return 'A few quick wins away from elite.'
  if (score >= 67) return 'Solid foundation — keep building.'
  if (score >= 50) return 'Plenty of upside. Finish your profile sections.'
  if (score >= 30) return 'Add socials and bio to unlock matches.'
  return 'Welcome — let’s start with the basics.'
}

/**
 * Maps an order to its action links. When the order has a provisioned entity
 * (sites row, brand_designs row, etc.) we deep-link straight to it; otherwise
 * we fall back to the module index.
 */
export function getProductActions(
  slug: string,
  entityId?: string | null
): { label: string; href: string }[] {
  const service = SERVICES.find((s) => s.id === slug)
  if (!service) return []

  switch (slug) {
    case 'personal-website':
      return entityId
        ? [
            { label: 'Open Site Builder', href: `/dashboard/sites/${entityId}` },
            { label: 'All Sites', href: '/dashboard/sites' },
          ]
        : [{ label: 'My Sites', href: '/dashboard/sites' }]
    case 'electronic-press-kit':
      return entityId
        ? [
            { label: 'Open EPK editor', href: `/dashboard/epks/${entityId}` },
            { label: 'All EPKs', href: '/dashboard/epks' },
          ]
        : [{ label: 'My EPKs', href: '/dashboard/epks' }]
    case 'create-a-mobile-app':
      return entityId
        ? [
            { label: 'Open App Builder', href: `/dashboard/apps/${entityId}` },
            { label: 'All Apps', href: '/dashboard/apps' },
          ]
        : [{ label: 'My Apps', href: '/dashboard/apps' }]
    case 'personal-brand-design':
    case 'brand-lite':
      return entityId
        ? [{ label: 'Open Design Studio', href: `/dashboard/brand-design/${entityId}` }]
        : [{ label: 'Design Studio', href: '/dashboard/brand-design' }]
    case 'start-a-podcast':
      return [{ label: 'Open Podcast Studio', href: '#' }]
    case 'create-an-online-store':
      return entityId
        ? [
            { label: 'Manage store', href: `/dashboard/stores/${entityId}` },
            { label: 'All stores', href: '/dashboard/stores' },
          ]
        : [{ label: 'My stores', href: '/dashboard/stores' }]
    default:
      return [{ label: 'Manage', href: '#' }]
  }
}
