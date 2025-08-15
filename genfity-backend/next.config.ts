import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
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
  
  // Experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  /* other config options here */
};

export default nextConfig;
