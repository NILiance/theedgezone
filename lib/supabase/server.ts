import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components can't set cookies — middleware handles refresh.
          }
        },
      },
    }
  )
}

/**
 * Service-role client for server actions that bypass RLS
 * (Stripe webhooks, admin operations, background jobs).
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is unset so callers can
 * degrade gracefully (admin pages render a "missing key" notice, the
 * Stripe webhook returns 503, etc.) rather than the entire page crashing.
 */
export function createServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}

/**
 * Service-role client that throws if missing — for code paths where
 * graceful degradation isn't possible (e.g. background-only operations).
 */
export function createServiceClientOrThrow() {
  const client = createServiceClient()
  if (!client) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for this operation')
  }
  return client
}
