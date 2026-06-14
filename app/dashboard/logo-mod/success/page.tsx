import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Logo Mod submitted' }

export default async function LogoModSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>
}) {
  const user = await requireUser()
  const { request: id } = await searchParams
  if (id) {
    const supabase = await createClient()
    await supabase
      .from('logo_mod_requests')
      .update({ paid_at: new Date().toISOString(), status: 'in_progress' })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'submitted')
  }
  return (
    <div className="mx-auto max-w-xl space-y-4 text-center">
      <p className="text-eyebrow text-success">Request received</p>
      <h1 className="text-display text-3xl font-black tracking-tight">Designer is on it.</h1>
      <p className="text-sm text-muted-foreground">
        We&apos;ll email you the first round inside your tier&apos;s turnaround window.
      </p>
      <div className="flex justify-center gap-3 pt-4">
        <Link
          href="/dashboard/logo-mod"
          className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-2 text-xs font-bold uppercase tracking-widest"
        >
          Back to Logo Mod
        </Link>
      </div>
    </div>
  )
}
