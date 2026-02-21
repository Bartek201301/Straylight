const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  images: {
    // Allow images from common domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/wikipedia/**',
      },
      {
        protocol: 'https',
        hostname: 'openai.com',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'claude.ai',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'midjourney.com',
        port: '',
        pathname: '/images/**',
      },
    ],
    // Enable modern image formats with priority order
    formats: ['image/avif', 'image/webp'],
    // Enhanced image optimization settings
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Responsive image device sizes (mobile-first)
    deviceSizes: [320, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different components and breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 768],
    // Enable unoptimized images for development
    unoptimized:
      process.env.NODE_ENV === 'development' &&
      process.env.OPTIMIZE_IMAGES !== 'true',
    // Domains for external image optimization
    domains: [],
    // Use default Next.js image optimization (custom loader disabled for now)
    // loader: 'default',
  },
  // Enable compression
  compress: true,
  // Optimize bundles
  swcMinify: true,

  // Enhanced caching headers
  async headers() {
    return [
      // Cache static assets aggressively
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400',
          },
          {
            key: 'Content-Encoding',
            value: 'br',
          },
        ],
      },
      // Cache optimized images
      {
        source: '/optimized/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400',
          },
          {
            key: 'Vary',
            value: 'Accept, Accept-Encoding',
          },
        ],
      },
      // Cache fonts
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache API responses with shorter duration (except stats)
      {
        source: '/api/((?!stats).)*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
      // Stats API routes - no caching for real-time data
      {
        source: '/api/stats/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Cache CSS and JS files
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@/components/ui',
      '@/components/admin',
      '@/components/effects',
      'lucide-react',
      'framer-motion',
      '@tiptap/react',
      '@tiptap/starter-kit',
    ],
    scrollRestoration: false,
    // Enable more granular splitting
    esmExternals: 'loose',
  },

  // Advanced webpack optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Simplified, more stable chunk splitting configuration
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 50000, // Increased from 20KB to 50KB to reduce chunk fragmentation
        maxSize: 500000, // Increased max size for better stability
        cacheGroups: {
          // Framework - keep Next.js and React together
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            priority: 40,
            chunks: 'all',
            enforce: true,
          },

          // All vendor libraries in one chunk for better loading
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 20,
            chunks: 'all',
            minChunks: 1,
          },

          // App-specific common code
          common: {
            test: /[\\/]src[\\/]/,
            name: 'common',
            priority: 10,
            chunks: 'all',
            minChunks: 2,
          },

          // Default chunk for remaining code
          default: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Additional optimizations
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
