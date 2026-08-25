"use client";

import { useEffect } from "react";

/**
 * 指で画面を動かしたらキーボードを閉じる（M-12）。
 *
 * スクロール量で判定すると、リストが短いときにしきい値へ届かず、
 * ゆっくり動かしても閉じない。「指で動かしたか」を直接見る方が確実。
 *
 * 全画面に効かせる。一覧の検索だけでなく、記録する画面のように縦に長い
 * フォームでも、キーボードが画面の半分を占めたままだと先が見えない。
 */
export default function DismissKeyboard() {
  useEffect(() => {
    // 指で操作する端末だけ。マウスのホイールで閉じると邪魔になる
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const onTouchMove = (e: TouchEvent) => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement)) return;
      if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return;
      // 入力欄そのものを指でなぞる操作（文字選択・スライダーの操作）は除く
      if (e.target === el) return;
      el.blur();
    };

    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => window.removeEventListener("touchmove", onTouchMove);
  }, []);

  return null;
}
