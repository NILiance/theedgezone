'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CATEGORIES,
  GUIDED_PATHS,
  SERVICES,
  type Audience,
  type CategoryKey,
  type Service,
} from '@/lib/services-data'
import { cn } from '@/lib/utils'

type AudienceFilter = 'all' | Audience
type CategoryFilter = 'all' | CategoryKey

const AUDIENCE_OPTS: { key: AudienceFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All Services', icon: '' },
  { key: 'talent', label: 'For Talent', icon: '🏆' },
  { key: 'brand', label: 'For Brands', icon: '🏢' },
]

interface ServicesShowcaseProps {
  initialAudience?: AudienceFilter
  audienceLocked?: boolean
}

export function ServicesShowcase({
  initialAudience = 'all',
  audienceLocked = false,
}: ServicesShowcaseProps = {}) {
  const [audience, setAudience] = useState<AudienceFilter>(initialAudience)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return SERVICES.filter((s) => {
      if (audience !== 'all' && !s.audience.includes(audience)) return false
      if (category !== 'all' && s.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !s.title.toLowerCase().includes(q) &&
          !s.tagline.toLowerCase().includes(q) &&
          !s.description.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [audience, category, search])

  const sectionsToShow =
    category === 'all'
      ? CATEGORIES.filter((c) => filtered.some((s) => s.category === c.key))
      : CATEGORIES.filter((c) => c.key === category)

  return (
    <div>
      {/* Search */}
      <div className="mx-auto mb-10 max-w-2xl">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services... (e.g. website, branding, legal)"
          className="text-display w-full rounded-full border border-border bg-panel/60 px-6 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
        />
      </div>

      {/* Audience filter — hidden when locked to a specific audience */}
      {!audienceLocked && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {AUDIENCE_OPTS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setAudience(opt.key)}
              className={cn(
                'text-display rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
                audience === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-panel/40 text-foreground/70 hover:text-foreground'
              )}
            >
              {opt.icon && <span className="mr-2">{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="mb-12 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={cn(
            'text-display rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
            category === 'all'
              ? 'bg-primary/20 text-primary ring-1 ring-primary'
              : 'border border-border bg-panel/40 text-foreground/70 hover:text-foreground'
          )}
        >
          All Categories
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            className={cn(
              'text-display rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
              category === c.key
                ? 'bg-primary/20 text-primary ring-1 ring-primary'
                : 'border border-border bg-panel/40 text-foreground/70 hover:text-foreground'
            )}
          >
            <span className="mr-1.5">{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Guided paths */}
      {audience === 'all' && category === 'all' && !search && (
        <div className="mb-12">
          <p className="text-eyebrow mb-4 text-foreground/70">Guided Paths</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {GUIDED_PATHS.map((path) => (
              <div
                key={path.name}
                className="rounded-[var(--radius)] border border-border bg-panel p-6 text-center transition-colors hover:border-primary/50"
              >
                <div className="text-3xl">{path.icon}</div>
                <p className="text-display mt-3 text-sm font-bold text-foreground">
                  {path.name}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {path.services} services
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services by category */}
      {sectionsToShow.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          No services match the current filters.
        </p>
      ) : (
        sectionsToShow.map((cat) => {
          const inSection = filtered.filter((s) => s.category === cat.key)
          if (!inSection.length) return null
          return (
            <section key={cat.key} className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-display flex items-center gap-2 text-xl font-black uppercase tracking-wider text-foreground">
                  <span>{cat.icon}</span>
                  {cat.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {inSection.length} service{inSection.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {inSection.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.id}`}
      className="group relative flex flex-col rounded-[var(--radius)] border border-border bg-panel p-6 transition-colors hover:border-primary/40"
    >
      {service.status && (
        <span
          className={cn(
            'text-display absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest',
            service.status === 'popular'
              ? 'bg-primary/20 text-primary'
              : 'bg-success/20 text-success'
          )}
        >
          {service.status}
        </span>
      )}
      <div className="text-center text-4xl">{service.icon}</div>
      <h4 className="text-display mt-4 text-center text-lg font-bold text-foreground">
        {service.title}
      </h4>
      <p className="mt-2 text-center text-sm text-muted-foreground">{service.tagline}</p>
      <p className="mt-4 line-clamp-3 text-center text-xs leading-relaxed text-muted-foreground/80">
        {service.description}
      </p>
      <div className="mt-6 flex items-center justify-between">
        <span className="text-display font-bold text-primary">{service.price}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-panel-elevated text-foreground/70 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          →
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {service.autoCreated && (
          <span className="inline-flex items-center gap-1 rounded-full bg-panel-elevated px-2.5 py-1 text-[10px] font-medium text-foreground/70">
            ⚡ Auto-Created
          </span>
        )}
        {service.expertTeam && (
          <span className="inline-flex items-center gap-1 rounded-full bg-panel-elevated px-2.5 py-1 text-[10px] font-medium text-foreground/70">
            🤝 Expert Team
          </span>
        )}
        {service.audience.includes('talent') && (
          <span className="inline-flex items-center gap-1 rounded-full bg-panel-elevated px-2.5 py-1 text-[10px] font-medium text-foreground/70">
            🏆 Talent
          </span>
        )}
        {service.audience.includes('brand') && (
          <span className="inline-flex items-center gap-1 rounded-full bg-panel-elevated px-2.5 py-1 text-[10px] font-medium text-foreground/70">
            🏢 Brand
          </span>
        )}
      </div>
    </Link>
  )
}
