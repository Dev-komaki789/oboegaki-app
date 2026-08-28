"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * 「戻る」は履歴を1つ戻る（pop）。
 *
 * <Link href="…"> だと履歴に新しく積むので、一覧→詳細→一覧→詳細 と
 * 押すたびに履歴が伸び、端末の戻るボタンで同じ画面を何度も遡ることになる。
 * アプリで期待される挙動は「来た道を1つ戻る」なので router.back() を使う。
 *
 * URL を直接開いた場合など、戻る先が無いときは fallback へ進む。
 *
 * 見た目は枠つきのピル＋山形。文字色だけだと押せることが伝わらなかった。
 */
export default function BackLink({
  fallback,
  children,
}: {
  fallback: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        // このタブでの遷移が1回でもあれば戻れる
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent-border bg-accent-tint py-2 pl-2 pr-3.5 text-action text-accent-500"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M10 3.5 5.5 8l4.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </button>
  );
}
