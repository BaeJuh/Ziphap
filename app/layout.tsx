import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "집합",
  description: "나 이날 놀고 싶어 — 캐주얼 그룹 모임 캘린더",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-bg text-txt">
        {/* 저장된 테마를 페인트 전에 적용 (깜빡임 방지) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='clean')document.documentElement.dataset.theme='clean';}catch(e){}`,
          }}
        />
        {/* 모바일 우선 앱 프레임 (prototype의 .app: max 430px 중앙 컬럼) */}
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col border-x border-line">
          {children}
        </div>
      </body>
    </html>
  );
}
