import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const user = await requireUser()
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ phyllo_connected_at: new Date().toISOString() })
    .eq('id', user.id)
  return NextResponse.json({ ok: true })
}
