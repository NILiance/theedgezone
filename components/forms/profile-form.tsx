'use client'

import { useActionState } from 'react'
import { updateProfile, type ProfileState } from '@/app/dashboard/actions'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  email: string
  defaultDisplayName: string
  defaultAvatarUrl: string
}

export function ProfileForm({ email, defaultDisplayName, defaultAvatarUrl }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    undefined
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account details</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-readonly">Email</Label>
            <Input id="email-readonly" type="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={defaultDisplayName}
              required
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              type="url"
              defaultValue={defaultAvatarUrl}
              placeholder="https://..."
            />
          </div>
          {state?.error && <Alert variant="destructive">{state.error}</Alert>}
          {state?.success && <Alert variant="success">{state.success}</Alert>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
