/**
 * Pre-launch site lock.
 *
 * When SITE_LOCK_PASSWORD is set, middleware gates every page behind a password
 * screen (/site-locked) until the visitor unlocks with the password. Unset the
 * env var to open the site to the public.
 *
 * The enable flag and password are read PER REQUEST (not memoized at module
 * load) so the Edge middleware and the Node route/page always agree on the
 * current value — a mismatch there would bounce the lock screen in a loop.
 *
 * Machine endpoints (Stripe webhooks, cron, Phyllo callbacks) and the lock
 * screen / unlock endpoint bypass the gate — they must always resolve.
 */
export const SITE_LOCK_COOKIE = 'ez_site_unlock'
const SALT = 'edgezone-site-lock::v1'

/** The configured lock password (empty string when unset). */
export function sitePassword(): string {
  return (process.env.SITE_LOCK_PASSWORD ?? '').trim()
}

/** True when the site lock is active. */
export function siteLockEnabled(): boolean {
  return sitePassword().length > 0
}

/**
 * Opaque unlock token = SHA-256(password + salt). Stored as the cookie value on
 * success so the plaintext password never lands in the browser's cookie jar.
 */
export async function siteLockToken(): Promise<string> {
  const bytes = new TextEncoder().encode(sitePassword() + SALT)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
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
