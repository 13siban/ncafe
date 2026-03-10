import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import ChatWidget from "@/components/chat/ChatWidget";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

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
    <html lang="ko" className={fraunces.variable}>
      <body>
        <AuthErrorHandler />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
