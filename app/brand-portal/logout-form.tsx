'use client'

import { Button } from '@/components/ui/button'
import { brandClientLogout } from './actions'

export function LogoutForm() {
  return (
    <form action={brandClientLogout}>
      <Button type="submit" size="sm" variant="ghost">
        Sign out
      </Button>
    </form>
  )
}
