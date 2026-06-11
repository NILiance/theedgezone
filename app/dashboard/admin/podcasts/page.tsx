import { AdminStub } from '@/components/admin/admin-stub'

export const metadata = { title: 'Podcasts' }

export default function Page() {
  return (
    <AdminStub
      title="Podcasts"
      description="Talent podcasts published via the Edge Zone podcast platform — RSS, episodes, distribution."
      features={[
        'List of athlete podcasts',
        'Per-row: title, owner email, status (Live), episode count',
        'Actions: EDIT, PREVIEW, RSS, DELETE',
        'Platform-wide podcast settings',
        'Default Apple Connect email',
        'Megaphone + Art19 API keys (DAI — Phase 2)',
        'Transcript provider (Whisper / Gemini / Deepgram — Phase 2)',
      ]}
      module="PodcastForTalent"
    />
  )
}
