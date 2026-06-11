import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight">Edge Zone</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The platform for athlete brand-building, fulfillment, and creator tools.
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
        <p className="mt-12 text-sm text-muted-foreground">
          Next-generation platform in active development.
        </p>
      </div>
    </main>
  )
}
