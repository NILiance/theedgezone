'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  uploadEnrollmentCsv,
  addManualEnrollment,
  removeInvitation,
  saveEnrollmentTemplate,
  sendEnrollmentBatch,
} from './actions'

interface Invitation {
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
}

interface Template {
  subject: string
  body: string
  reply_to: string | null
}

interface Props {
  invitations: Invitation[]
  template: Template
}

export function EnrollmentClient({ invitations, template }: Props) {
  const [section, setSection] = useState<'list' | 'upload' | 'template'>('list')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['list', `Invitations (${invitations.length})`],
            ['upload', 'Upload / add'],
            ['template', 'Email template'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              section === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'list' && <InvitationList invitations={invitations} />}
      {section === 'upload' && <UploadAndManual />}
      {section === 'template' && <TemplateEditor template={template} />}
    </div>
  )
}

function InvitationList({ invitations }: { invitations: Invitation[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const send = (scope: 'all_pending' | 'selected') => {
    if (!confirm(scope === 'all_pending' ? 'Send invitation email to ALL pending recipients?' : `Send to ${selected.size} selected?`)) return
    setStatus(null)
    const fd = new FormData()
    fd.set('scope', scope)
    if (scope === 'selected') fd.set('invitation_ids', Array.from(selected).join(','))
    startTransition(async () => {
      const res = await sendEnrollmentBatch(fd)
      if (res.ok) {
        setStatus(`Sent ${res.sent ?? 0}, failed ${res.failed ?? 0}.`)
        setSelected(new Set())
      } else setStatus(res.message ?? 'Send failed')
    })
  }

  const handleRemove = (id: string) => {
    if (!confirm('Remove this invitation? (Doesn\'t affect sent emails or signed-up accounts.)')) return
    const fd = new FormData()
    fd.set('invitation_id', id)
    startTransition(async () => {
      await removeInvitation(fd)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => send('all_pending')} disabled={isPending}>
          {isPending ? 'Sending…' : 'Send to all pending'}
        </Button>
        <Button
          variant="outline"
          onClick={() => send('selected')}
          disabled={isPending || selected.size === 0}
        >
          Send to selected ({selected.size})
        </Button>
        {status && <p className="text-xs text-success">{status}</p>}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
        <table className="w-full text-sm">
          <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.size === invitations.length && invitations.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelected(new Set(invitations.map((i) => i.id)))
                    else setSelected(new Set())
                  }}
                  className="h-4 w-4 accent-primary"
                />
              </th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">School</th>
              <th className="px-3 py-2 text-left">Sport</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last sent</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No invitations yet. Use Upload / add to import.
                </td>
              </tr>
            )}
            {invitations.map((inv) => (
              <tr key={inv.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(inv.id)}
                    onChange={() => toggle(inv.id)}
                    className="h-4 w-4 accent-primary"
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs">{inv.email}</td>
                <td className="px-3 py-2 text-xs">{inv.display_name ?? '—'}</td>
                <td className="px-3 py-2 text-xs">{inv.school ?? '—'}</td>
                <td className="px-3 py-2 text-xs">{inv.sport ?? '—'}</td>
                <td className="px-3 py-2">
                  <StatusPill status={inv.status} />
                  {inv.failure_message && (
                    <p className="mt-1 text-[10px] text-destructive" title={inv.failure_message}>
                      {inv.failure_message.slice(0, 40)}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(inv.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    ×
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'sent'
      ? 'bg-success/20 text-success'
      : status === 'opened' || status === 'converted'
      ? 'bg-accent/20 text-accent'
      : status === 'failed'
      ? 'bg-destructive/20 text-destructive'
      : 'bg-panel-elevated text-muted-foreground'
  return (
    <span
      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
    >
      {status}
    </span>
  )
}

function UploadAndManual() {
  const [csv, setCsv] = useState('')
  const [isPending, startTransition] = useTransition()
  const [csvStatus, setCsvStatus] = useState<string | null>(null)
  const [manualStatus, setManualStatus] = useState<string | null>(null)

  const upload = () => {
    setCsvStatus(null)
    const fd = new FormData()
    fd.set('csv', csv)
    startTransition(async () => {
      const res = await uploadEnrollmentCsv(fd)
      if (res.ok) {
        setCsvStatus(`Inserted ${res.inserted ?? 0}, skipped ${res.skipped ?? 0}.`)
        setCsv('')
      } else setCsvStatus(res.message ?? 'Upload failed')
    })
  }

  const manualSubmit = (fd: FormData) => {
    setManualStatus(null)
    startTransition(async () => {
      const res = await addManualEnrollment(fd)
      if (res.ok) setManualStatus('Added.')
      else setManualStatus(res.message ?? 'Failed')
    })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">CSV upload</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Headers: <code>email,name,sport,school,programs,notes</code>. Email is required;
          others optional. Programs comma-separated within the field.
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={10}
          placeholder={`email,name,sport,school,programs\njane@example.com,Jane Doe,basketball,Duke,personal-website;brand-design`}
          className="mt-3 flex w-full rounded-[var(--radius-sm)] border border-border bg-background p-3 font-mono text-xs"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={upload} disabled={isPending || csv.length < 5}>
            {isPending ? 'Importing…' : 'Import CSV'}
          </Button>
          {csvStatus && <p className="text-xs text-success">{csvStatus}</p>}
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Add manually</p>
        <form action={manualSubmit} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="m_email">Email</Label>
            <Input id="m_email" name="email" type="email" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="m_name">Name</Label>
              <Input id="m_name" name="display_name" />
            </div>
            <div>
              <Label htmlFor="m_sport">Sport</Label>
              <Input id="m_sport" name="sport" />
            </div>
            <div>
              <Label htmlFor="m_school">School</Label>
              <Input id="m_school" name="school" />
            </div>
            <div>
              <Label htmlFor="m_programs">Programs (comma-sep)</Label>
              <Input id="m_programs" name="programs" placeholder="brand-design, personal-website" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Add'}
            </Button>
            {manualStatus && <p className="text-xs text-success">{manualStatus}</p>}
          </div>
        </form>
      </section>
    </div>
  )
}

function TemplateEditor({ template }: { template: Template }) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [replyTo, setReplyTo] = useState(template.reply_to ?? '')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const save = () => {
    setStatus(null)
    const fd = new FormData()
    fd.set('subject', subject)
    fd.set('body', body)
    if (replyTo) fd.set('reply_to', replyTo)
    startTransition(async () => {
      const res = await saveEnrollmentTemplate(fd)
      if (res.ok) setStatus('Template saved.')
      else setStatus(res.message ?? 'Failed')
    })
  }

  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="space-y-3">
        <div>
          <Label htmlFor="t_subject">Subject</Label>
          <Input
            id="t_subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="You're invited to Edge Zone"
          />
        </div>
        <div>
          <Label htmlFor="t_body">Body</Label>
          <textarea
            id="t_body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background p-3 text-sm leading-relaxed"
          />
        </div>
        <div>
          <Label htmlFor="t_reply">Reply-to (optional)</Label>
          <Input
            id="t_reply"
            type="email"
            value={replyTo}
            onChange={(e) => setReplyTo(e.target.value)}
            placeholder="hello@theedgezone.com"
          />
        </div>
        <p className="rounded-[var(--radius-sm)] border border-border bg-background p-3 text-xs text-muted-foreground">
          Available tokens: <code>{`{NAME}`}</code> · <code>{`{EMAIL}`}</code> ·{' '}
          <code>{`{SPORT}`}</code> · <code>{`{SCHOOL}`}</code> · <code>{`{PROGRAMS}`}</code> ·{' '}
          <code>{`{LOGIN_URL}`}</code> (claim-your-account link)
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save template'}
          </Button>
          {status && <p className="text-xs text-success">{status}</p>}
        </div>
      </div>
    </section>
  )
}
