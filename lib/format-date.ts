/**
 * Date/time formatting in US Eastern time (America/New_York — handles
 * EST/EDT automatically). Use this for any SERVER-rendered timestamp:
 * server components format with the deploy's timezone (UTC on Vercel),
 * which otherwise shows times hours ahead of Eastern.
 */
const EASTERN = 'America/New_York'

type DateInput = string | number | Date | null | undefined

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Date + time in Eastern, e.g. "Jun 26, 2026, 2:32 PM". */
export function formatEastern(value: DateInput): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleString('en-US', {
    timeZone: EASTERN,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Date only in Eastern, e.g. "Jun 26, 2026". */
export function formatEasternDate(value: DateInput): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', {
    timeZone: EASTERN,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
