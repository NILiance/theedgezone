import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <p className="text-eyebrow text-accent">The Edge Zone Platform</p>
        <h1 className="text-display mt-4 text-6xl font-black tracking-tight sm:text-7xl">
          Build your brand.
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Run your business.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          The all-in-one platform for athlete brand design, fulfillment, sites,
          stores, podcasts, and apps.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button size="lg">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="lg">Create account</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
