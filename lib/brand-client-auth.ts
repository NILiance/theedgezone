/**
 * Brand-client session management.
 *
 * Magic-link auth for external brand customers (not Supabase auth users).
 * The token is set in a cookie after the user visits /brand/{token}; the
 * portal then looks it up against the brand_client_tokens table to identify
 * who's logged in.
 */
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

export const BRAND_CLIENT_COOKIE = 'ez_brand_client'
const SESSION_DAYS = 30

export interface BrandClientSession {
  brandClientId: string
  name: string
  contact_email: string
  company: string | null
  status: string
}

/** Load the brand client identified by the cookie. Null if unauthenticated. */
export async function getBrandClientSession(): Promise<BrandClientSession | null> {
  const jar = await cookies()
  const token = jar.get(BRAND_CLIENT_COOKIE)?.value
  if (!token) return null
  const supabase = createServiceClient()
  if (!supabase) return null

  const { data: tokRow } = await supabase
    .from('brand_client_tokens')
    .select('brand_client_id, expires_at')
    .eq('token', token)
    .maybeSingle()
  if (!tokRow || new Date(tokRow.expires_at).getTime() < Date.now()) return null

  const { data: client } = await supabase
    .from('brand_clients')
    .select('id, name, contact_email, company, status')
    .eq('id', tokRow.brand_client_id)
    .maybeSingle()
  if (!client || client.status !== 'active') return null

  return {
    brandClientId: client.id,
    name: client.name,
    contact_email: client.contact_email,
    company: client.company,
    status: client.status,
  }
}

/** Sets the brand-client session cookie. Returns whether it succeeded. */
export async function setBrandClientSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(BRAND_CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    path: '/',
  })
}

export async function clearBrandClientSession() {
  const jar = await cookies()
  jar.delete(BRAND_CLIENT_COOKIE)
}
