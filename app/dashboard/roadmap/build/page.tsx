import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { RoadmapWizard } from './wizard'

export const metadata = { title: 'Build your roadmap' }

export default async function BuildRoadmapPage() {
  await requireUser()
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/roadmap"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Roadmap
        </Link>
        <p className="text-eyebrow mt-3 text-accent">Roadmap Builder</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
          Build your personalized roadmap
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Answer a few questions — we&apos;ll score your NIL readiness and recommend the services
          that move you forward fastest.
        </p>
      </div>
      <RoadmapWizard />
    </div>
  )
}
