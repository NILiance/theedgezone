'use client'

import { useRef, useState } from 'react'

export interface ReelItem {
  id: string
  title: string
  summary: string | null
  video_url: string
}

/**
 * Auto-advancing reel player — plays each milestone's narrator video
 * back-to-back, like a continuous sizzle reel. Click any chapter to jump.
 */
export function ReelPlayer({ items }: { items: ReelItem[] }) {
  const [current, setCurrent] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const go = (idx: number) => {
    if (idx < 0 || idx >= items.length) return
    setCurrent(idx)
    // Let the src swap, then play.
    requestAnimationFrame(() => {
      videoRef.current?.load()
      void videoRef.current?.play().catch(() => {})
    })
  }

  const item = items[current]
  if (!item) return null

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="overflow-hidden rounded-[var(--radius)] border border-white/10 bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            src={item.video_url}
            controls
            autoPlay
            playsInline
            onEnded={() => go(current + 1)}
            className="aspect-video w-full bg-black"
          />
        </div>
        <div className="mt-4">
          <p className="text-display text-xs font-bold uppercase tracking-widest text-primary">
            Chapter {current + 1} of {items.length}
          </p>
          <h2 className="text-display mt-1 text-2xl font-black">{item.title}</h2>
          {item.summary && <p className="mt-1 text-sm text-white/60">{item.summary}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => go(current - 1)}
              disabled={current === 0}
              className="text-display rounded-[var(--radius-sm)] border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => go(current + 1)}
              disabled={current === items.length - 1}
              className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <aside>
        <p className="text-display mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
          Chapters
        </p>
        <ol className="space-y-1.5">
          {items.map((it, idx) => {
            const active = idx === current
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => go(idx)}
                  className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                  }`}
                >
                  <span
                    className={`text-display flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className={`min-w-0 flex-1 truncate text-sm ${active ? 'text-white' : 'text-white/70'}`}>
                    {it.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>
    </div>
  )
}
