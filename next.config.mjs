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
  serverExternalPackages: ['sharp'],
  // Force-include sharp's @img/sharp-libvips-linux-x64 sibling package
  // in every server function's traced bundle. Sharp loads libvips via
  // dynamic require at runtime, which Vercel's node-file-trace doesn't
  // follow — so without this, deploys fail with:
  //   ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object
  // The glob covers @img/sharp-linux-x64 + @img/sharp-libvips-linux-x64
  // for both glibc and musl.
  outputFileTracingIncludes: {
    '/**/*': ['./node_modules/@img/**/*'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
}

export default nextConfig
