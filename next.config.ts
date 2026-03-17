// import type { NextConfig } from 'next'

// const nextConfig: NextConfig = {
//   experimental: { typedRoutes: true },
//   images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
// }

// export default nextConfig




import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {},
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
}

export default nextConfig