import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모두의 근육",
  description: "시각적 피드백 기반 체형·운동 포인트 안내 (의학적·전문가 판정 아님)",
  applicationName: "모두의 근육",
  appleWebApp: { capable: true, title: "모두의 근육" },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
