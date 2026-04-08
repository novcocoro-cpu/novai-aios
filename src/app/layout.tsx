import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOVAI METAL-OS — 金属メッキ経営支援AI",
  description: "金属メッキ加工会社向けの経営支援AIウェブアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
