'use client'

import { useRef } from 'react'

/** HTML5 audio with a one-shot play beacon for analytics. */
export function EpisodePlayer({
  episodeId,
  src,
  className,
}: {
  episodeId: string
  src: string
  className?: string
}) {
  const fired = useRef(false)

  const onPlay = () => {
    if (fired.current) return
    fired.current = true
    const body = JSON.stringify({ episode_id: episodeId })
    try {
      const ok =
        typeof navigator !== 'undefined' &&
        navigator.sendBeacon?.('/api/podcasts/play', new Blob([body], { type: 'application/json' }))
      if (!ok) {
        void fetch('/api/podcasts/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      /* analytics is best-effort */
    }
  }

  return <audio controls preload="none" src={src} className={className} onPlay={onPlay} />
}
