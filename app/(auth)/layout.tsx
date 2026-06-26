import { Wordmark } from '@/components/landing/wordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Wordmark />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
