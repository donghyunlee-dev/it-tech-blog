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
    // design-system.md는 단일 라이트 테마를 전제로 한다(다크모드 미정의). @sfood/ui의 semantic.css는
    // 방문자 OS가 다크 모드면 자동으로 어두운 토큰으로 전환되는데(get_tokens theme 옵션과 별개로
    // 실제 배포된 CSS에도 media query가 있음), data-theme="light"를 명시해 그 전환을 막아
    // 우리 커스텀 CSS(고정 라이트)와 @sfood/ui 컴포넌트가 항상 같은 톤을 쓰도록 고정한다.
    <html lang="ko" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
