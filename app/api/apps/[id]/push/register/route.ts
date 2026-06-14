import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isValidExpoToken } from '@/lib/expo-push'

/**
 * POST /api/apps/[id]/push/register
 *
 * Called from inside the generated Expo app once the user grants push
 * permission. The body carries the device's Expo push token plus optional
 * metadata. This endpoint is unauthenticated by design — the app id +
 * token pair is the credential.
 *
 * Body: { token, platform?, deviceLabel?, appVersion?, locale? }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: appId } = await params
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })
  }

  const { data: app } = await supabase
    .from('talent_apps')
    .select('id, status')
    .eq('id', appId)
    .maybeSingle()
  if (!app) return NextResponse.json({ error: 'Unknown app' }, { status: 404 })

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token || !isValidExpoToken(token)) {
    return NextResponse.json({ error: 'Invalid Expo push token' }, { status: 400 })
  }
  const platform = typeof body.platform === 'string' ? body.platform : null
  const deviceLabel = typeof body.deviceLabel === 'string' ? body.deviceLabel.slice(0, 120) : null
  const appVersion = typeof body.appVersion === 'string' ? body.appVersion.slice(0, 40) : null
  const locale = typeof body.locale === 'string' ? body.locale.slice(0, 20) : null

  const { error } = await supabase
    .from('app_push_devices')
    .upsert(
      {
        app_id: appId,
        expo_push_token: token,
        platform: platform === 'ios' || platform === 'android' || platform === 'web' ? platform : null,
        device_label: deviceLabel,
        app_version: appVersion,
        locale,
        last_seen_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: 'app_id,expo_push_token' }
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/apps/[id]/push/register?token=...
 *
 * Soft-revokes a device token when the user opts out or uninstalls.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: appId } = await params
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')?.trim()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = createServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })

  const { error } = await supabase
    .from('app_push_devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('app_id', appId)
    .eq('expo_push_token', token)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
