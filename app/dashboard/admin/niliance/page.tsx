import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'NILiance Bridge' }

export default function Page() {
  return (
    <AdminStub
      title="NILiance Bridge"
      description="Configure the Sharetribe integration that auto-creates NILiance accounts on Edge Zone signup, syncs profile data, and powers the Talent Directory."
      features={[
        'Active environment toggle (Production / Staging)',
        'Backend choice (Sharetribe Integration API vs NILiance Wrapper)',
        'Sharetribe Integration API credentials',
        'Sharetribe Marketplace API credentials (trusted:user scope)',
        'Auto-create NILiance account on Edge Zone signup',
        'Polling settings (interval + batch size for inbound sync)',
        'Field sync toggles (social handles, school, sport/position)',
        'Buttons: Test connection, Install cron, Flush permalinks, Run poll',
        'Public talent profile URL template ({id}, {slug}, {uuid})',
        'Sync dashboard with linked-users count + error count',
        'Recent events log (info-level Sharetribe sync messages)',
        'Per-user sync status with Retry / Inspect / Wipe+Resync / Re-link actions',
      ]}
      module="EdgeZoneNiliance"
    />
  )
}
