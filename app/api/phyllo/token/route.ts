import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createPhylloUser, createSdkToken, phylloConfigured } from '@/lib/phyllo'

/**
 * POST /api/phyllo/token
 * Returns { phylloUserId, sdkToken, environment }.
 * Creates a Phyllo user on first call and persists the ID on profiles.
 */
export async function POST() {
  if (!phylloConfigured()) {
    return NextResponse.json(
      { error: 'PHYLLO_CLIENT_* not configured on the deploy.' },
      { status: 503 }
    )
  }
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phyllo_user_id')
    .eq('id', user.id)
    .maybeSingle()

  let phylloUserId = profile?.phyllo_user_id ?? null
  if (!phylloUserId) {
    const create = await createPhylloUser({
      name: profile?.display_name ?? user.email ?? 'Edge Zone user',
      externalId: user.id,
    })
    if (!create.ok) return NextResponse.json({ error: create.error }, { status: 500 })
    phylloUserId = create.userId
    await supabase
      .from('profiles')
      .update({ phyllo_user_id: phylloUserId })
      .eq('id', user.id)
  }

  const tokenRes = await createSdkToken({ phylloUserId })
  if (!tokenRes.ok) return NextResponse.json({ error: tokenRes.error }, { status: 500 })

  return NextResponse.json({
    phylloUserId,
    sdkToken: tokenRes.token,
    environment: process.env.PHYLLO_ENVIRONMENT ?? 'sandbox',
  })
}

/**
 * POST /api/phyllo/token/disconnect — clears phyllo_user_id on the profile.
 * (Real implementation would also call Phyllo to revoke; v1 just clears
 *  the local link.)
 */
export async function DELETE() {
  const user = await requireUser()
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ phyllo_user_id: null, phyllo_connected_at: null })
    .eq('id', user.id)
  return NextResponse.json({ ok: true })
}
