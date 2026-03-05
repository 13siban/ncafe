import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
  // BFF 패턴: /api/* 요청은 Catch-all API Route (app/api/[...path]/route.ts)가 처리합니다.
  // 하지만 정적 이미지 자원은 JWT 주입이 필요 없으므로 단순 rewrite로 연결합니다.
  async rewrites() {
    // 환경변수 확인 (없으면 빌드 환경(prod)에서는 backend:8080, 로컬에서는 localhost:8080 사용)
    const isProd = process.env.NODE_ENV === 'production';
    const backendUrl = process.env.API_BASE_URL || (isProd ? 'http://backend:8080' : 'http://localhost:8080');

    return [
      {
        // 1. /upload/ 경로 대응 (DB 저장 이미지 등)
        source: '/upload/:path*',
        destination: `${backendUrl}/upload/:path*`,
      },
      {
        // 2. /images/ 경로 대응 (기존 코드 호환성)
        // espresso.png 등이 upload 폴더에 있으므로 /upload로 연결
        source: '/images/:path*',
        destination: `${backendUrl}/upload/:path*`,
      },
      {
        // 3. 백엔드 정적 리소스 (static 폴더) 대응
        // 파일 확장자가 있는 요청 중 위에서 걸러지지 않은 것들을 백엔드 루트로 연결
        source: '/:file(.*\.(?:png|jpg|jpeg|gif|webp|svg|ico))$',
        destination: `${backendUrl}/:file`,
      }
    ];
  },
};

export default nextConfig;
