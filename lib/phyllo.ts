/**
 * Phyllo creator-identity helper.
 *
 * Phyllo issues short-lived SDK tokens scoped to a Phyllo user. We create
 * the user on first connect, persist their phyllo_user_id on the profile,
 * then mint tokens on demand. Client uses the token with the Phyllo
 * Connect SDK to OAuth into Instagram / TikTok / YouTube / etc.
 *
 * Env:
 *   PHYLLO_CLIENT_ID
 *   PHYLLO_CLIENT_SECRET
 *   PHYLLO_ENVIRONMENT   sandbox | staging | production
 */
import { env } from '@/lib/env'

const ENVIRONMENT_BASE: Record<string, string> = {
  sandbox: 'https://api.sandbox.getphyllo.com',
  staging: 'https://api.staging.getphyllo.com',
  production: 'https://api.getphyllo.com',
}

export function phylloConfigured(): boolean {
  return Boolean(env.PHYLLO_CLIENT_ID && env.PHYLLO_CLIENT_SECRET)
}

function getBaseUrl(): string {
  return ENVIRONMENT_BASE[env.PHYLLO_ENVIRONMENT] ?? ENVIRONMENT_BASE.sandbox!
}

function authHeader(): string {
  const creds = Buffer.from(`${env.PHYLLO_CLIENT_ID}:${env.PHYLLO_CLIENT_SECRET}`).toString(
    'base64'
  )
  return `Basic ${creds}`
}

/** Create a Phyllo user. Returns the Phyllo user UUID. */
export async function createPhylloUser(opts: {
  name: string
  externalId: string
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  if (!phylloConfigured()) return { ok: false, error: 'PHYLLO_CLIENT_* not configured' }
  try {
    const res = await fetch(`${getBaseUrl()}/v1/users`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: opts.name, external_id: opts.externalId }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Phyllo /users HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    const data = (await res.json()) as { id: string }
    return { ok: true, userId: data.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Phyllo error' }
  }
}

/**
 * Mint a short-lived SDK token for an existing Phyllo user.
 * Pass the products you want enabled — typically ['IDENTITY', 'ENGAGEMENT'].
 */
export async function createSdkToken(opts: {
  phylloUserId: string
  products?: Array<'IDENTITY' | 'ENGAGEMENT' | 'INCOME' | 'PUBLISH_CONTENT' | 'ACTIVITY'>
}): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (!phylloConfigured()) return { ok: false, error: 'PHYLLO_CLIENT_* not configured' }
  try {
    const res = await fetch(`${getBaseUrl()}/v1/sdk-tokens`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: opts.phylloUserId,
        products: opts.products ?? ['IDENTITY', 'ENGAGEMENT'],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return {
        ok: false,
        error: `Phyllo /sdk-tokens HTTP ${res.status}: ${text.slice(0, 200)}`,
      }
    }
    const data = (await res.json()) as { sdk_token: string }
    return { ok: true, token: data.sdk_token }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Phyllo error' }
  }
}
