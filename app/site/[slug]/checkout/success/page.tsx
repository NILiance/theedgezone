import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string }>
}

const KIND_MESSAGES: Record<string, { title: string; body: string }> = {
  tip: {
    title: 'Tip received',
    body: 'Thanks for the support — it goes directly to the talent.',
  },
  merch: {
    title: 'Order confirmed',
    body: 'A receipt is on its way to your email. Fulfillment kicks off automatically.',
  },
  shoutout: {
    title: 'Shoutout requested',
    body: 'The talent has been notified and will record your shoutout shortly.',
  },
  tier: {
    title: 'Welcome to the membership',
    body: 'Your subscription is active. You\'ll get receipts and renewal notices by email.',
  },
}

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const sessionId = sp.session_id

  let kind = 'tip'
  if (sessionId) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_transactions')
      .select('kind, status')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()
    if (data?.kind) kind = data.kind
  }

  const message = KIND_MESSAGES[kind] ?? KIND_MESSAGES.tip!

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="max-w-md text-center">
        <div className="text-6xl">✓</div>
        <h1 className="text-display mt-4 text-3xl font-black tracking-tight">{message.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message.body}</p>
        <Link
          href={`/site/${slug}`}
          className="text-display mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90"
        >
          Back to site
        </Link>
      </div>
    </main>
  )
}
