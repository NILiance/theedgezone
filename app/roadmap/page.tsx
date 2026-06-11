import { MarketingNav } from '@/components/landing/marketing-nav'
import { Footer } from '@/components/landing/footer'
import { RoadmapQuiz } from '@/components/landing/roadmap-quiz'

export const metadata = { title: 'Free Roadmap' }

export default function RoadmapPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
          <p className="text-eyebrow text-accent">Free Roadmap</p>
          <h1 className="text-display mt-3 text-5xl font-black uppercase tracking-tight sm:text-6xl">
            Your Personal{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Roadmap.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Answer a few questions and we&apos;ll build a step-by-step plan customized for your
            goals, budget, and timeline.
          </p>
        </section>
        <section className="mx-auto max-w-4xl px-6 pb-20">
          <RoadmapQuiz />
        </section>
      </main>
      <Footer />
    </>
  )
}
