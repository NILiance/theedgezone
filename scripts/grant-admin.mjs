#!/usr/bin/env node
/**
 * Grant admin role to a user by email.
 *   pnpm grant:admin you@example.com
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

let env = {}
try {
  const envContent = readFileSync(envPath, 'utf-8')
  env = Object.fromEntries(
    envContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=')
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      })
  )
} catch (err) {
  console.error(`Failed to read ${envPath}:`, err.message)
  process.exit(1)
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]

if (!email) {
  console.error('Usage: pnpm grant:admin <email>')
  process.exit(1)
}
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const {
  data: { users },
  error: listError,
} = await supabase.auth.admin.listUsers({ perPage: 1000 })
if (listError) {
  console.error('Failed to list users:', listError.message)
  process.exit(1)
}

const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!user) {
  console.error(`No user found with email: ${email}`)
  process.exit(1)
}

const { error: insertError } = await supabase
  .from('user_roles')
  .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id,role' })

if (insertError) {
  console.error('Failed to grant admin role:', insertError.message)
  process.exit(1)
}

console.log(`OK — granted admin role to ${email} (user_id: ${user.id})`)
