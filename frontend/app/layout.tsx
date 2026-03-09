import type { Metadata } from "next";
import "./globals.css";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import ChatWidget from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: "mymyy - 특별한 미식 경험",
  description: "최고의 재료와 정성으로 준비한 커피와 디저트를 만나보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthErrorHandler />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
