import { Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Pre-launch lock screen. Shown by middleware for every gated request while
 * SITE_LOCK_PASSWORD is set. The form posts the password to /api/unlock, which
 * verifies it and sets the unlock cookie.
 */
export default async function SiteLockedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/80 p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Lock className="h-5 w-5 text-white" aria-hidden />
          </div>
          <h1 className="font-display text-xl font-bold text-white">Edge Zone</h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            This site is private and not yet open to the public.
          </p>
        </div>

        <form action="/api/unlock" method="POST" className="space-y-3">
          <input
            type="password"
            name="password"
            autoFocus
            required
            autoComplete="current-password"
            placeholder="Enter password"
            aria-label="Password"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              Incorrect password. Please try again.
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  )
}
