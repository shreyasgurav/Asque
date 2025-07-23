/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize images and enable domains for potential future use
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'i.pravatar.cc',
      'images.unsplash.com',
      'via.placeholder.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? process.env.NEXT_PUBLIC_APP_URL || 'https://asque.chat'
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
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

  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.NODE_ENV === 'production' ? 'production-value' : 'development-value',
  },

  // Experimental features
  experimental: {
    // Enable server components (if using)
    // serverComponents: true, // Removed - deprecated
    // Enable app directory (if using)
    // appDir: false, // Removed - deprecated
  },

  // Webpack configuration for optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // Compression
  compress: true,

  // Powered by header
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Output configuration
  output: 'standalone',

  // Trailing slash
  trailingSlash: false,

  // Base path (if deploying to a subdirectory)
  // basePath: '',

  // Asset prefix (if using CDN)
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.example.com' : '',
};

module.exports = nextConfig; 