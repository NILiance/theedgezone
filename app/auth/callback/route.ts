import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handles auth callback from Supabase email links:
 *   - Signup confirmation
 *   - Magic link sign-in
 *   - Password reset (then forwards to /reset-password)
 *
 * Supabase appends `?code=<single-use-code>` to the redirect URL.
 * We exchange that code for a session, then forward to `next` (default /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=callback_failed`)
}
