"use client";

import { useRef, type ReactNode } from "react";

/**
 * 開くと中身が下に伸びる折りたたみ。
 *
 * 削除ボタンは2段階（開いてから押す）にしてあるが、開いた中身が画面の下や
 * 固定ボタンの裏に隠れて、スクロールしないと見えなかった。
 * 開いたときに、はみ出したぶんだけ自動で送る。
 */
export default function Disclosure({
  summary,
  children,
  className,
  summaryClassName,
}: {
  summary: string;
  children: ReactNode;
  className?: string;
  summaryClassName?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  const onToggle = () => {
    const el = ref.current;
    if (!el || !el.open) return;

    // 中身が描かれてから測る
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      // スマホは下に固定ボタンがある。タブレット（lg 以上）では固定していない
      const barHeight = window.innerWidth >= 1024 ? 0 : 96;
      const overflow = rect.bottom - (window.innerHeight - barHeight);
      if (overflow > 0) {
        window.scrollBy({ top: overflow + 16, behavior: "smooth" });
      }
    });
  };

  return (
    <details ref={ref} onToggle={onToggle} className={className}>
      <summary className={summaryClassName}>{summary}</summary>
      {children}
    </details>
  );
}
