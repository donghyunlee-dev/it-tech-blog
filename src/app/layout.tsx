import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SFOOD IT Tech Blog",
  description: "SFOOD IT 담당 및 AX팀을 위한 사내 기술 블로그",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
