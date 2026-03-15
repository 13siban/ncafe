import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
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
  // BFF 패턴: 빌드 타임 환경변수 평가 문제를 해결하기 위해,
  // 모든 정적 이미지/업로드 자원 요청을 런타임에 동작하는 BFF API Route(/api/[...path]/route.ts)로 보냅니다.
  async rewrites() {
    return [
      {
        // 1. /upload/ 경로 대응 -> BFF 프록시로 전달
        source: '/upload/:path*',
        destination: '/api/upload/:path*',
      },
      {
        // 2. /images/ 경로 대응 (호환성) -> BFF 프록시의 /upload로 전달
        source: '/images/:path*',
        destination: '/api/upload/:path*', // 백엔드는 /upload 폴더를 사용
      },
      {
        // 3. 백엔드 정적 리소스 (static 폴더) 대응
        source: '/:file(.*\.(?:png|jpg|jpeg|gif|webp|svg|ico))$',
        destination: '/api/:file',
      }
    ];
  },
};

export default nextConfig;
