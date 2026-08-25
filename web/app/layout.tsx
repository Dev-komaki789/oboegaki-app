import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const zen = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-zen-kaku",
});

export const metadata: Metadata = {
  title: "おぼえがき",
  description: "会う直前の30秒で、前回の話を思い出す。",
  manifest: "/manifest.json",
  // iOS はこれが無いと、ホーム画面から開いてもブラウザで開く
  appleWebApp: {
    capable: true,
    title: "おぼえがき",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F6F3",
  width: "device-width",
  initialScale: 1,
  // ホーム画面から起動したとき、下端の余白（ホームバー）を避ける
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        className={`${zen.variable} font-zen bg-neutral-bg text-ink-primary antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
