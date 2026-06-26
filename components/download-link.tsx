'use client'

import { useState, type ReactNode } from 'react'

/**
 * Forces a real download instead of navigating away.
 *
 * The HTML `download` attribute is ignored for cross-origin URLs (our files
 * live on *.supabase.co), so a plain <a download> just opens the file in the
 * browser — "taking you to a new page." Here we fetch the file as a blob and
 * download that, so the user stays on the page. If the fetch is blocked
 * (CORS, e.g. a Google Drive link), we fall back to opening in a new tab so
 * the click still does something.
 */
export function DownloadLink({
  url,
  filename,
  className,
  children,
  title,
}: {
  url: string
  filename: string
  className?: string
  children: ReactNode
  title?: string
}) {
  const [busy, setBusy] = useState(false)

  async function onClick(e: React.MouseEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <a href={url} download={filename} onClick={onClick} className={className} title={title}>
      {children}
    </a>
  )
}
