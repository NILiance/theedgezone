/**
 * Thin wrapper around the Vercel v9 / v10 Domains API.
 * Docs: https://vercel.com/docs/rest-api/reference/endpoints/projects/add-a-domain-to-a-project
 *
 * Configured via env:
 *   VERCEL_ACCESS_TOKEN — personal or team token with project:write
 *   VERCEL_PROJECT_ID   — the project to attach domains to
 *   VERCEL_TEAM_ID      — optional, only for team-owned projects
 *
 * Each call returns either { ok: true, data } or { ok: false, error }.
 */
import { env } from '@/lib/env'

const BASE = 'https://api.vercel.com'

interface VercelOk<T> {
  ok: true
  data: T
}
interface VercelErr {
  ok: false
  error: string
}
export type VercelResult<T> = VercelOk<T> | VercelErr

interface VercelDomain {
  name: string
  apexName: string
  projectId: string
  verified: boolean
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>
}

interface VercelDomainConfig {
  configuredBy?: 'CNAME' | 'A' | null
  acceptedChallenges?: string[]
  misconfigured: boolean
}

function headers() {
  if (!env.VERCEL_ACCESS_TOKEN) {
    throw new Error('VERCEL_ACCESS_TOKEN missing')
  }
  return {
    Authorization: `Bearer ${env.VERCEL_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function withTeam(path: string): string {
  if (env.VERCEL_TEAM_ID) {
    const sep = path.includes('?') ? '&' : '?'
    return `${path}${sep}teamId=${env.VERCEL_TEAM_ID}`
  }
  return path
}

export function vercelConfigured(): boolean {
  return Boolean(env.VERCEL_ACCESS_TOKEN && env.VERCEL_PROJECT_ID)
}

/** Add a domain to the Vercel project. Idempotent: re-adds are no-ops. */
export async function addDomain(domain: string): Promise<VercelResult<VercelDomain>> {
  if (!vercelConfigured()) return { ok: false, error: 'Vercel not configured' }
  try {
    const res = await fetch(
      withTeam(`${BASE}/v10/projects/${env.VERCEL_PROJECT_ID}/domains`),
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: domain }),
      }
    )
    if (res.status === 409) {
      // Already added — treat as success and pull current state.
      return getDomain(domain)
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return {
        ok: false,
        error: typeof body.error?.message === 'string' ? body.error.message : `HTTP ${res.status}`,
      }
    }
    const data = (await res.json()) as VercelDomain
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Look up a single domain attached to our project. */
export async function getDomain(domain: string): Promise<VercelResult<VercelDomain>> {
  if (!vercelConfigured()) return { ok: false, error: 'Vercel not configured' }
  try {
    const res = await fetch(
      withTeam(`${BASE}/v9/projects/${env.VERCEL_PROJECT_ID}/domains/${domain}`),
      { headers: headers() }
    )
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.error?.message ?? `HTTP ${res.status}` }
    }
    const data = (await res.json()) as VercelDomain
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Return Vercel's verdict on the domain's DNS configuration. */
export async function getDomainConfig(domain: string): Promise<VercelResult<VercelDomainConfig>> {
  if (!vercelConfigured()) return { ok: false, error: 'Vercel not configured' }
  try {
    const res = await fetch(withTeam(`${BASE}/v6/domains/${domain}/config`), {
      headers: headers(),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.error?.message ?? `HTTP ${res.status}` }
    }
    const data = (await res.json()) as VercelDomainConfig
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Trigger verification on a pending domain (after the user updates DNS). */
export async function verifyDomain(domain: string): Promise<VercelResult<VercelDomain>> {
  if (!vercelConfigured()) return { ok: false, error: 'Vercel not configured' }
  try {
    const res = await fetch(
      withTeam(`${BASE}/v9/projects/${env.VERCEL_PROJECT_ID}/domains/${domain}/verify`),
      { method: 'POST', headers: headers() }
    )
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.error?.message ?? `HTTP ${res.status}` }
    }
    const data = (await res.json()) as VercelDomain
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Remove a domain from the Vercel project. */
export async function removeDomain(domain: string): Promise<VercelResult<{ uid?: string }>> {
  if (!vercelConfigured()) return { ok: false, error: 'Vercel not configured' }
  try {
    const res = await fetch(
      withTeam(`${BASE}/v9/projects/${env.VERCEL_PROJECT_ID}/domains/${domain}`),
      { method: 'DELETE', headers: headers() }
    )
    if (!res.ok && res.status !== 404) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.error?.message ?? `HTTP ${res.status}` }
    }
    return { ok: true, data: {} }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
