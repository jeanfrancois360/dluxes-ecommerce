const path = require('path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin file-tracing root to monorepo root — prevents nft from scanning
  // outside the project if a stray lockfile exists above it
  outputFileTracingRoot: path.join(__dirname, '../..'),
  reactStrictMode: true,
  // swcMinify: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build (already type-checked separately)
    ignoreBuildErrors: false,
  },
  experimental: {
    // Disabled optimizePackageImports to prevent dynamic import issues in Next.js 15
    // optimizePackageImports: ['@nextpik/ui', '@nextpik/design-system'],
    // M1 Mac Performance Optimizations
    cpus: 2, // Limit CPU cores for compilation
  },
  // M1 Mac Memory Optimization
  webpack: (config, { isServer }) => {
    // Fix for packages that use browser-only globals
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
      };

      // Externalize browser-only packages on the server
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'canvas-confetti': 'canvas-confetti',
        });
      }
    }

    // Simplified optimization to prevent dynamic import issues
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };

    // Reduce parallelism to save memory
    config.parallelism = 1;

    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
    // Configure quality levels to prevent warnings
    qualities: [75, 90, 95],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // Transpile packages from workspace
  transpilePackages: ['@nextpik/ui', '@nextpik/design-system', '@nextpik/shared'],
  output: 'standalone',
};

module.exports = withNextIntl(nextConfig);
