import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SERVICES } from '@/lib/services-data'

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
  const orders = (ordersRes.data ?? []) as DashboardOrder[]

  return { profile, orders }
})

/** Maps NIL readiness score to a letter grade matching the legacy display. */
export function readinessGrade(score: number): string {
  if (score >= 93) return 'A+'
  if (score >= 87) return 'A'
  if (score >= 83) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 73) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 67) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
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
      return [
        { label: 'View Store', href: '#' },
        { label: 'Edit Store', href: '#' },
      ]
    default:
      return [{ label: 'Manage', href: '#' }]
  }
}
