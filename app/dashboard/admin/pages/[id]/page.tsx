import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { EditPageForm } from './edit-form'

export const metadata = { title: 'Edit Page' }

export default async function EditCmsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: page } = await supabase.from('cms_pages').select('*').eq('id', id).maybeSingle()
  if (!page) notFound()
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-eyebrow text-primary">CMS</p>
          <h2 className="text-display mt-1 text-2xl font-black tracking-tight">{page.title}</h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">/{page.slug}</p>
        </div>
        <Link
          href="/dashboard/admin/pages"
          className="text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          ← Back to pages
        </Link>
      </div>
      <EditPageForm page={page} />
    </div>
  )
}
