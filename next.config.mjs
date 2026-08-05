/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        // Google profile pictures (lh3.googleusercontent.com)
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
