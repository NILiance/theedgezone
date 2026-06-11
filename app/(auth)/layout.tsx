import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="text-display mb-8 text-2xl font-black tracking-tight"
      >
        EDGE <span className="text-accent">ZONE</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
