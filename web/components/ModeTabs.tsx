"use client";

import { useState, type ReactNode } from "react";

/**
 * 情報タブの「時系列／話題別」切り替え（§9 S-04）。
 *
 * 両方の中身をサーバーで描いておいて、表示だけを切り替える。
 * 同じ records を並べ替えているだけなので、切り替えのたびにサーバーへ
 * 行く必要がない（往復ゼロ＝一瞬で切り替わる）。
 *
 * URL は history.replaceState で合わせるだけにする。ページ遷移を起こさず、
 * リロードや共有では ?mode=topic がそのまま効く。
 */
export default function ModeTabs({
  initialMode,
  basePath,
  timeline,
  byTopic,
}: {
  initialMode: "time" | "topic";
  basePath: string;
  timeline: ReactNode;
  byTopic: ReactNode;
}) {
  const [mode, setMode] = useState<"time" | "topic">(initialMode);

  const pick = (m: "time" | "topic") => {
    setMode(m);
    window.history.replaceState(
      null,
      "",
      m === "topic" ? `${basePath}?mode=topic` : basePath,
    );
  };

  const pill = (on: boolean) =>
    "rounded-full px-5 py-2 text-action " +
    (on
      ? "bg-accent-500 font-bold text-neutral-card"
      : "bg-neutral-chip text-ink-secondary");

  return (
    <>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={() => pick("time")} className={pill(mode === "time")}>
          時系列
        </button>
        <button type="button" onClick={() => pick("topic")} className={pill(mode === "topic")}>
          話題別
        </button>
      </div>
      {mode === "topic" ? byTopic : timeline}
    </>
  );
}
