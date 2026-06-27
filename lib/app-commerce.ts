/**
 * App Builder commerce model — products (Shop tab) + subscription tiers / tip
 * jar / fan-wall settings (Fans tab). Ported from ez-app-mgr.js E.app.commerce.
 * Stored in settings.commerce (no migration).
 */

export interface AppProductVariant {
  name: string
  value: string
  price_adj: string
}

export interface AppProduct {
  id: string
  name: string
  description: string
  price: string
  category: string
  image: string
  inventory: string
  active: boolean
  variants: AppProductVariant[]
}

export interface AppTier {
  id: string
  name: string
  price: string
  perks: string // newline-separated
  gated_screens: string[]
  nav_button: '' | 'show' | 'badge'
}

export interface AppCommerce {
  products: AppProduct[]
  subscription_tiers: AppTier[]
  tip_jar: { presets: string; custom_amount: boolean; message: string }
  fan_wall: { moderation: boolean; require_login: boolean }
}

export function emptyCommerce(): AppCommerce {
  return {
    products: [],
    subscription_tiers: [],
    tip_jar: { presets: '5, 10, 25, 50', custom_amount: true, message: '' },
    fan_wall: { moderation: false, require_login: false },
  }
}

export function resolveCommerce(saved: unknown): AppCommerce {
  const base = emptyCommerce()
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    const s = saved as Partial<AppCommerce>
    return {
      products: Array.isArray(s.products) ? s.products : [],
      subscription_tiers: Array.isArray(s.subscription_tiers) ? s.subscription_tiers : [],
      tip_jar: { ...base.tip_jar, ...(s.tip_jar ?? {}) },
      fan_wall: { ...base.fan_wall, ...(s.fan_wall ?? {}) },
    }
  }
  return base
}
