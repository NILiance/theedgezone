/**
 * Pre-launch site lock.
 *
 * When SITE_LOCK_PASSWORD is set, middleware gates every page behind a password
 * screen (/site-locked) until the visitor unlocks with the password. Unset the
 * env var to open the site to the public.
 *
 * Machine endpoints (Stripe webhooks, cron, Phyllo callbacks) and the lock
 * screen / unlock endpoint itself bypass the gate — they must always resolve.
 * Edge-safe (used from middleware) and Node-safe (used from the unlock route).
 */
import { env } from '@/lib/env'

export const SITE_LOCK_COOKIE = 'ez_site_unlock'
const SALT = 'edgezone-site-lock::v1'

export const sitePassword = (env.SITE_LOCK_PASSWORD ?? '').trim()
export const siteLockEnabled = sitePassword.length > 0

let cachedToken: string | null = null

/**
 * Opaque unlock token = SHA-256(password + salt). Stored as the cookie value on
 * success so the plaintext password never lands in the browser's cookie jar.
 */
export async function siteLockToken(): Promise<string> {
  if (cachedToken) return cachedToken
  const bytes = new TextEncoder().encode(sitePassword + SALT)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  cachedToken = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return cachedToken
}

/**
 * Paths that are never gated and never host-rewritten: the lock screen, the
 * unlock endpoint, and server-to-server callbacks that can't present a password.
 */
const SYSTEM_PREFIXES = [
  '/site-locked',
  '/api/unlock',
  '/api/webhooks/',
  '/api/cron/',
  '/api/phyllo/',
  '/.well-known/',
]

export function isSystemPath(pathname: string): boolean {
  return SYSTEM_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
