import type { Metadata } from "next";
import "./globals.css";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import ChatWidget from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: "NCafe - 카페 메뉴 관리",
  description: "카페 사장님을 위한 메뉴 관리 시스템",
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
