import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        {children}
      </body>
    </html>
  );
}
