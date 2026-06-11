'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { dismissNilianceBanner } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'

interface NilianceBannerProps {
  email: string
}

export function NilianceBanner({ email }: NilianceBannerProps) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="relative rounded-[var(--radius)] border border-primary/40 bg-gradient-to-br from-panel via-panel to-primary/5 p-6 shadow-elevated">
      <button
        type="button"
        onClick={() => startTransition(() => dismissNilianceBanner())}
        disabled={pending}
        aria-label="Dismiss"
        className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
      >
        ✕
      </button>

      <div className="flex items-start gap-4">
        <span className="text-4xl">🎉</span>
        <div className="flex-1">
          <p className="text-eyebrow text-primary">Your NILiance Account Is Ready</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            When you joined The Edge Zone, we automatically set you up on{' '}
            <span className="font-bold text-foreground">NILiance</span> &mdash; our NIL
            Innovations Marketplace. No separate signup needed. Log in there with the same
            email{' '}
            <span className="text-display rounded bg-background/60 px-2 py-0.5 text-xs text-foreground">
              {email}
            </span>{' '}
            and Edge Zone password.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href="https://niliance-o0nl.onrender.com/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm">LOG IN TO NILIANCE →</Button>
            </a>
            <Link href="/niliance-for-talent">
              <Button size="sm" variant="outline">
                WHAT CAN I DO THERE?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
