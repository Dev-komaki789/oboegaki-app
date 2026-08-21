import type { Metadata } from "next";
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
