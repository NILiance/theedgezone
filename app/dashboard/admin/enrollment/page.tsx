import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { EnrollmentClient } from './enrollment-client'

export const metadata = { title: 'Enrollment' }

export default async function EnrollmentAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()

  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing — enrollment management needs it to read across all rows.
      </p>
    )
  }

  const [{ data: invitations }, { data: template }] = await Promise.all([
    supabase
      .from('enrollment_invitations')
      .select(
        'id, email, display_name, sport, school, programs, status, sent_at, opened_at, failure_message, enrolled_at'
      )
      .order('enrolled_at', { ascending: false })
      .limit(500),
    supabase
      .from('enrollment_template')
      .select('subject, body, reply_to')
      .eq('id', 1)
      .single(),
  ])

  const statusCounts = new Map<string, number>()
  for (const inv of invitations ?? []) {
    statusCounts.set(inv.status, (statusCounts.get(inv.status) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Enrollment</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">
          Bulk enrollment & outreach
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a CSV of prospective talents, customize the invitation email, send through
          Resend. Per-recipient status (sent / failed / converted) tracked below.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Total" value={(invitations ?? []).length.toLocaleString()} />
        <Tile label="Sent" value={(statusCounts.get('sent') ?? 0).toLocaleString()} />
        <Tile label="Pending" value={(statusCounts.get('pending') ?? 0).toLocaleString()} />
        <Tile
          label="Failed"
          value={(statusCounts.get('failed') ?? 0).toLocaleString()}
        />
      </div>

      <EnrollmentClient
        invitations={
          (invitations ?? []) as Array<{
            id: string
            email: string
            display_name: string | null
            sport: string | null
            school: string | null
            programs: string[] | null
            status: string
            sent_at: string | null
            opened_at: string | null
            failure_message: string | null
            enrolled_at: string
          }>
        }
        template={template ?? { subject: '', body: '', reply_to: null }}
      />
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className="text-display mt-1 text-2xl font-black text-primary">{value}</p>
    </div>
  )
}
