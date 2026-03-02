import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8031',
        pathname: '/**',
      },
    ],
  },
  // BFF 패턴: /api/* 요청은 Catch-all API Route (app/api/[...path]/route.ts)가 처리합니다.
  // 하지만 정적 이미지 자원은 JWT 주입이 필요 없으므로 단순 rewrite로 연결합니다.
  async rewrites() {
    const backendUrl = process.env.API_BASE_URL || 'http://localhost:8031';
    return [
      {
        source: '/images/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};


export default nextConfig;
