import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "aceternity.com",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
      {
        protocol: "https",
        hostname: "miro.medium.com",
      },
      {
        protocol: "https",
        hostname: "karthikeyanj.netlify.app",
      },
      {
        protocol: 'https',
        hostname: 'backend.vlinkinfo.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },      
      {
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
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
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
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
  
  /* other config options here */
};

export default withNextIntl(nextConfig);
