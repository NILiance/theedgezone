import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Print order submitted' }

export default async function PrintOrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const user = await requireUser()
  const { order: orderId } = await searchParams
  if (orderId) {
    const supabase = await createClient()
    await supabase
      .from('print_orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('status', 'draft')
  }
  return (
    <div className="mx-auto max-w-xl space-y-4 text-center">
      <p className="text-eyebrow text-success">Order received</p>
      <h1 className="text-display text-3xl font-black tracking-tight">We&apos;re on it.</h1>
      <p className="text-sm text-muted-foreground">
        Your print order is in the queue. You&apos;ll get an email with tracking once it ships.
      </p>
      <div className="flex justify-center gap-3 pt-4">
        <Link
          href="/dashboard/print-shop"
          className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-2 text-xs font-bold uppercase tracking-widest"
        >
          Back to Print Shop
        </Link>
      </div>
    </div>
  )
}
