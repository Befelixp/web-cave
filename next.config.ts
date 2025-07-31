import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Reativar para testar a solução
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
