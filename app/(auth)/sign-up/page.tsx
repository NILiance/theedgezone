import { SignUpForm } from '@/components/forms/sign-up-form'

export const metadata = { title: 'Sign up' }

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  return <SignUpForm signupRef={typeof ref === 'string' ? ref : undefined} />
}
