import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/forms/profile-form'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-muted-foreground">Update your name and avatar.</p>
      </div>
      <ProfileForm
        email={user.email ?? ''}
        defaultDisplayName={profile?.display_name ?? ''}
        defaultAvatarUrl={profile?.avatar_url ?? ''}
      />
    </div>
  )
}
