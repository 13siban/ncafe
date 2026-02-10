import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        // 1. 브라우저가 호출하는 주소
        source: '/api/:path*', 
        // 2. 실제로 데이터를 가져올 주소 (로컬 스프링 부트)
        destination: 'http://localhost:8080/:path*', 
      },
      {
        // 업로드된 이미지 등 정적 파일 전용 통로
        source: '/images/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
};

export default nextConfig;
