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
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8031';
    return [
      {
        // 1. 브라우저가 호출하는 주소
        source: '/api/:path*',
        // 2. 실제로 데이터를 가져올 주소 (로컬 스프링 부트)
        destination: `${backendUrl}/:path*`,
      },
      {
        // 업로드된 이미지 등 정적 파일 전용 통로
        source: '/images/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
