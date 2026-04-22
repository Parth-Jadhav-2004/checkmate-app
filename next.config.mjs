/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent Next.js from bundling pdf-parse — must run natively in Node.js
  serverExternalPackages: ["pdf-parse"],
}

export default nextConfig
