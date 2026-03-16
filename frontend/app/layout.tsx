import type { Metadata } from "next";
import "./globals.css";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import ChatWidget from "@/components/chat/ChatWidget";
import { Toaster } from 'react-hot-toast';
import NoticePopupModal from "@/components/common/NoticePopupModal";
import GlobalOrderTracker from "@/components/common/GlobalOrderTracker";

export async function generateMetadata(): Promise<Metadata> {
  // 서버 사이드에서 실행되므로 Docker 내부 네트워크 주소를 사용
  const apiUrl = process.env.API_BASE_URL || 'http://localhost:8080';
  
  try {
    const res = await fetch(`${apiUrl}/store/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch store info');
    const data = await res.json();
    
    const title = data.cafeName || "mymyy - 특별한 미식 경험";
    const description = data.description || "최고의 재료와 정성으로 준비한 커피와 디저트를 만나보세요.";
    const faviconUrl = data.faviconUrl ? `/images/${data.faviconUrl}` : "/favicon-light.png";
    const faviconDarkUrl = data.faviconDarkUrl ? `/images/${data.faviconDarkUrl}` : "/favicon-dark.png";

    return {
      title,
      description,
      icons: {
        icon: [
          {
            url: faviconUrl,
            media: "(prefers-color-scheme: light)",
          },
          {
            url: faviconDarkUrl,
            media: "(prefers-color-scheme: dark)",
          },
        ],
      },
    };
  } catch (error) {
    return {
      title: "mymyy - 특별한 미식 경험",
      description: "최고의 재료와 정성으로 준비한 커피와 디저트를 만나보세요.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthErrorHandler />
        {children}
        <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
        <ChatWidget />
        <NoticePopupModal />
        <GlobalOrderTracker />
      </body>
    </html>
  );
}
