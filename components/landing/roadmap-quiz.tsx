'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { generatePublicRoadmapPlan } from '@/app/roadmap/actions'

const PERSONAS = [
  { id: 'hs_talent', icon: '🏈', title: 'High School Talent', sub: 'Preparing for college & NIL' },
  { id: 'college_talent', icon: '🏆', title: 'College Talent', sub: 'Active NIL opportunity' },
  { id: 'pro_talent', icon: '⭐', title: 'Pro / Former Talent', sub: 'Building post-career brand' },
  { id: 'parent', icon: '👨‍👩‍👦', title: 'Parent / Guardian', sub: "Supporting child's NIL" },
  { id: 'brand', icon: '🏢', title: 'Brand / Business', sub: 'Marketing with talent partnerships' },
  { id: 'school', icon: '🎓', title: 'School / Admin', sub: 'NIL programs for institution' },
]

const SPORTS = [
  'Football',
  'Basketball',
  'Baseball',
  'Softball',
  'Soccer',
  'Track & Field',
  'Swimming',
  'Tennis',
  'Golf',
  'Volleyball',
  'Wrestling',
  'Lacrosse',
  'Hockey',
  'Gymnastics',
  'Cheer/Dance',
  'Esports',
  'Other',
]

const SOCIAL_TIERS = [
  { id: 'none', title: 'No social media yet', sub: 'Starting from scratch' },
  { id: '1k', title: 'Under 1,000 followers', sub: 'Just getting started' },
  { id: '10k', title: '1K — 10K followers', sub: 'Building momentum' },
  { id: '100k', title: '10K — 100K followers', sub: 'Established presence' },
  { id: '100k+', title: '100K+ followers', sub: 'Major influence' },
  { id: 'unsure', title: 'Not sure', sub: "I don't track this" },
]

const PRIORITIES: { group: string; items: { id: string; icon: string; label: string }[] }[] = [
  {
    group: 'Revenue & Growth',
    items: [
      { id: 'brand_deals', icon: '🤝', label: 'Attract brand partnerships' },
      { id: 'merch', icon: '🏪', label: 'Sell products or merchandise' },
      { id: 'following', icon: '📈', label: 'Grow my following' },
      { id: 'budget_nil', icon: '💡', label: 'Enhance my NIL on a budget' },
    ],
  },
  {
    group: 'Brand & Identity',
    items: [
      { id: 'personal_brand', icon: '🎨', label: 'Build a personal brand' },
      { id: 'digital_identity', icon: '🌐', label: 'Establish a digital identity' },
      { id: 'content', icon: '📱', label: 'Create content for social media' },
    ],
  },
  {
    group: 'Education & Performance',
    items: [
      { id: 'learn_nil', icon: '📚', label: 'Learn about NIL' },
      { id: 'performance', icon: '⚡', label: 'Enhance athletic performance' },
      { id: 'health', icon: '💚', label: 'Mental and physical health' },
    ],
  },
  {
    group: 'Protection & Future',
    items: [
      { id: 'protect_nil', icon: '🛡️', label: 'Protect my name, image and likeness' },
      { id: 'finance', icon: '💰', label: 'Financial guidance' },
      { id: 'contracts', icon: '📝', label: 'Help with contract negotiation' },
      { id: 'nil_deal', icon: '📋', label: 'Prepare for an NIL deal' },
      { id: 'after_sports', icon: '🎓', label: 'Prepare for life after sports' },
      { id: 'network', icon: '🤝', label: 'Network with other talent' },
    ],
  },
]

const BUDGETS = [
  { id: 'free', title: '$0', sub: 'Free only' },
  { id: 'under_25', title: 'Under $25/mo', sub: 'Starter' },
  { id: '25_50', title: '$25-$50/mo', sub: 'Growing' },
  { id: '50_100', title: '$50-$100/mo', sub: 'Serious' },
  { id: '100_300', title: '$100-$300/mo', sub: 'Committed' },
  { id: '300+', title: '$300+/mo', sub: 'All in' },
]

interface Answers {
  persona?: string
  sport?: string
  social?: string
  priorities: string[]
  budget?: string
}

export function RoadmapQuiz() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({ priorities: [] })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const startOver = () => {
    setAnswers({ priorities: [] })
    setStep(0)
    setGenerating(false)
    setError(null)
  }

  // Build the plan from the answers and send the visitor to their roadmap.
  const submit = (budgetId: string) => {
    const finalAnswers = { ...answers, budget: budgetId }
    setAnswers(finalAnswers)
    setError(null)
    setGenerating(true)
    startTransition(async () => {
      const res = await generatePublicRoadmapPlan({
        persona: finalAnswers.persona ?? '',
        sport: finalAnswers.sport ?? '',
        social: finalAnswers.social ?? '',
        priorities: finalAnswers.priorities,
        budget: budgetId,
      })
      if (res.ok && res.token) {
        router.push(`/roadmap/plan/${res.token}`)
      } else {
        setError(res.message ?? 'Could not build your roadmap.')
        setGenerating(false)
      }
    })
  }

  const set = (key: keyof Answers, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }))
    setStep((s) => s + 1)
  }

  const togglePriority = (id: string) =>
    setAnswers((a) =>
      a.priorities.includes(id)
        ? { ...a, priorities: a.priorities.filter((p) => p !== id) }
        : { ...a, priorities: [...a.priorities, id] }
    )

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => Math.max(0, s - 1))

  if (generating || step >= 5) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel p-12 text-center shadow-elevated">
        <div className="text-4xl">🚀</div>
        <h3 className="text-display mt-4 text-2xl font-black text-foreground">
          Building your personalized roadmap…
        </h3>
        {error ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t build your roadmap just now. Create a free account and we&apos;ll have
              it waiting in your dashboard.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg">
                <a href="/sign-up">CREATE YOUR FREE ACCOUNT →</a>
              </Button>
              <button
                type="button"
                onClick={startOver}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Start over
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 animate-pulse text-muted-foreground">
            Crunching your answers and mapping your step-by-step plan…
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel p-8 shadow-elevated sm:p-12">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        <p className="text-eyebrow text-primary">Step {step + 1} of 5</p>
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
        )}
      </div>
      <div className="mb-8 h-1 w-full rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((step + 1) / 5) * 100}%` }}
        />
      </div>

      {step === 0 && (
        <div>
          <h3 className="text-display text-2xl font-black text-foreground">Who are you?</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => set('persona', p.id)}
                className="rounded-[var(--radius-sm)] border border-border bg-background/50 p-4 text-left transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <p className="text-display font-bold text-foreground">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.sub}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h3 className="text-display text-2xl font-black text-foreground">What sport?</h3>
          <div className="mt-6 flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('sport', s)}
                className={cn(
                  'rounded-full border border-border bg-background/50 px-4 py-2 text-sm transition-colors hover:border-primary hover:text-foreground',
                  answers.sport === s ? 'border-primary text-primary' : 'text-muted-foreground'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-display text-2xl font-black text-foreground">
            What&apos;s your social media presence?
          </h3>
          <div className="mt-6 grid gap-3">
            {SOCIAL_TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => set('social', t.id)}
                className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border bg-background/50 p-4 text-left transition-colors hover:border-primary"
              >
                <div>
                  <p className="text-display font-bold text-foreground">{t.title}</p>
                  <p className="text-sm text-muted-foreground">{t.sub}</p>
                </div>
                <span className="text-muted-foreground">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="text-display text-2xl font-black text-foreground">
            What are your top priorities?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Select all that apply.</p>
          <div className="mt-6 space-y-6">
            {PRIORITIES.map((group) => (
              <div key={group.group}>
                <p className="text-eyebrow mb-3 text-primary">{group.group}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.items.map((item) => {
                    const active = answers.priorities.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => togglePriority(item.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-[var(--radius-sm)] border bg-background/50 p-3 text-left text-sm transition-colors',
                          active
                            ? 'border-primary text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                        {active && <span className="ml-auto text-primary">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Button size="lg" onClick={next} disabled={answers.priorities.length === 0}>
              Continue →
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h3 className="text-display text-2xl font-black text-foreground">
            What&apos;s your monthly budget?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Don&apos;t worry &mdash; many services are free or very affordable. This helps us
            prioritize.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => submit(b.id)}
                className="rounded-[var(--radius-sm)] border border-border bg-background/50 p-4 text-center transition-colors hover:border-primary"
              >
                <p className="text-display text-lg font-black text-foreground">{b.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{b.sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
