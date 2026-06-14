import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { setBrandClientSessionCookie } from '@/lib/brand-client-auth'

/**
 * GET /brand/[token]
 * Magic-link landing. Validates the token, marks it consumed, sets the
 * brand-client session cookie, then redirects to /brand-portal.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const supabase = createServiceClient()
  if (!supabase) {
    return new NextResponse('Server misconfiguration — service role missing.', { status: 503 })
  }

  const { data: tokRow } = await supabase
    .from('brand_client_tokens')
    .select('token, brand_client_id, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!tokRow) {
    return NextResponse.redirect(new URL('/brand-portal?error=invalid', request.url))
  }
  if (new Date(tokRow.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL('/brand-portal?error=expired', request.url))
  }

  // Mark consumed (best-effort)
  await supabase
    .from('brand_client_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', token)

  await setBrandClientSessionCookie(token)
  return NextResponse.redirect(new URL('/brand-portal', request.url))
}
