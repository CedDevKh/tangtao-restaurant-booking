import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Disable React Strict Mode to prevent double-invocation of effects in dev,
  // which can cause Leaflet to initialize the same map container twice.
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.hyatt.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'z-p3-scontent.fpnh5-5.fna.fbcdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent.fpnh11-2.fna.fbcdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dynamic-media-cdn.tripadvisor.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Production optimizations
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  
  // API rewrites for production
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  
  // Output configuration for deployment
  output: 'standalone',
};

export default nextConfig;
