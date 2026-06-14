import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function StoreCheckoutSuccessPage({ params }: PageProps) {
  const { slug } = await params
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="max-w-md text-center">
        <div className="text-6xl">✓</div>
        <h1 className="text-display mt-4 text-3xl font-black tracking-tight text-black">
          Order confirmed
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          A receipt is on its way to your email. We&apos;ll send tracking once the order ships.
        </p>
        <Link
          href={`/store/${slug}`}
          className="text-display mt-8 inline-block rounded-full bg-black px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90"
        >
          Back to store
        </Link>
      </div>
    </main>
  )
}
