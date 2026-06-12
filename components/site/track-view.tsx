'use client'

import { useEffect } from 'react'

/**
 * Drop into the public site renderer. Posts a view event to /api/track
 * once, on first render.
 */
export function TrackView({
  siteId,
  pageId,
  path,
}: {
  siteId: string
  pageId?: string
  path: string
}) {
  useEffect(() => {
    // Use sendBeacon if available — survives page unloads.
    try {
      const payload = JSON.stringify({ site_id: siteId, page_id: pageId, path })
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      /* swallow */
    }
  }, [siteId, pageId, path])

  return null
}
