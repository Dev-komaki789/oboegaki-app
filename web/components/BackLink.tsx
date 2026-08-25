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
 */
export default function BackLink({
  fallback,
  className,
  children,
}: {
  fallback: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        // このタブでの遷移が1回でもあれば戻れる
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      {children}
    </button>
  );
}
