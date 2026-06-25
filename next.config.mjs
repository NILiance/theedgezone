/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**.ideogram.ai' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  // Keep sharp's native binary outside the webpack bundle so its
  // platform-specific .node + libvips files load correctly at runtime.
  // Linux x64 binaries are pulled in via the explicit @img/sharp-*
  // optionalDependencies in package.json — Vercel's nft picks them up
  // naturally from node_modules without needing outputFileTracingIncludes.
  serverExternalPackages: ['sharp'],
  // Ship the migration .sql files to the admin Migrations dashboard's
  // serverless function so it can list them at runtime. Scoped to that
  // single route — these are tiny text files, no bundle-size concern.
  outputFileTracingIncludes: {
    '/dashboard/admin/migrations': ['./supabase/migrations/**/*.sql'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
}

export default nextConfig
