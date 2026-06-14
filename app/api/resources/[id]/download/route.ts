import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/resources/{id}/download
 * Increments the download counter and 302s to the file_url or external_url.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: row } = await supabase
    .from('resources')
    .select('id, file_url, external_url, published, download_count')
    .eq('id', id)
    .maybeSingle()
  if (!row || !row.published) {
    return NextResponse.redirect(new URL('/resources', request.url))
  }
  const target = row.file_url || row.external_url
  if (!target) {
    return NextResponse.redirect(new URL('/resources', request.url))
  }
  await supabase
    .from('resources')
    .update({ download_count: (row.download_count ?? 0) + 1 })
    .eq('id', row.id)
  return NextResponse.redirect(target)
}
