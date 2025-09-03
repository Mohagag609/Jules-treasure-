/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    unoptimized: true
  },
  // إعدادات مهمة لـ Render
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // تعطيل eslint أثناء البناء
  eslint: {
    ignoreDuringBuilds: true
  },
  // تعطيل TypeScript errors أثناء البناء
  typescript: {
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig