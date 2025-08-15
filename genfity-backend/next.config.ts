import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },      {
        protocol: 'https',
        hostname: 'api.ozwaretech.com',
        port: '',
        pathname: '/product-images/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },

      // Add other trusted hostnames here as needed
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/product-images/**',
      },
    ],
  },
  /* other config options here */
};

export default nextConfig;
