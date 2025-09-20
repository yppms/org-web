/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests from Cloudflare tunnel domain
  allowedDevOrigins: [
    'dev-web.miftahussalam.or.id',
    'localhost'
  ],

  devIndicators: false,
  
  // Configure external image sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yppms.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Optional: Configure headers for CORS if needed
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://dev-web.miftahussalam.or.id',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
