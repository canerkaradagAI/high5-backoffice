const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Only set output to 'export' if explicitly needed (for static export)
  // Otherwise leave undefined for server-side rendering (Vercel default)
  output: process.env.NEXT_OUTPUT_MODE === 'export' ? 'export' : undefined,
  experimental: {
    // outputFileTracingRoot: path.join(__dirname, '../'), // KALDIRILDI - Vercel'de çift path sorunu yaratıyor
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

module.exports = nextConfig;
