"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();

  // value  = 画面に見えている文字（変換中の文字も含む）
  // query  = 実際に検索に使う文字（変換が確定したものだけ）
  const [value, setValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  const composing = useRef(false);
  const isFirst = useRef(true);

  const inputRef = useRef<HTMLInputElement>(null);
  /** スクロール量を測る基準。null の間は閉じない */
  const baseY = useRef<number | null>(null);

  useEffect(() => {
    // 初回表示では検索し直さない（URLの q がそのまま出ている状態）
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    // 打つ手が止まって 300ms たってから動く。
    // 途中で次の文字が来たら、下の clearTimeout で取り消される
    const timer = setTimeout(() => {
      const q = query.trim();
      router.replace(q ? `/people?q=${encodeURIComponent(q)}` : "/people", {
        scroll: false,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router]);

  /**
   * リストをスクロールしたらキーボードを閉じる（M-12）。
   * 検索してもキーボードが画面の半分を占めたままだと結果が読めない。
   */
  useEffect(() => {
    // 指で操作する端末だけ。マウスのホイールで閉じると邪魔になる
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const onScroll = () => {
      const start = baseY.current;
      if (start === null) return;
      if (Math.abs(window.scrollY - start) > 48) inputRef.current?.blur();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // JavaScript が動く前でも Enter で検索できるよう form は残す
    <form action="/people" className="mt-5">
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        placeholder="名前・見た目・会社名で検索"
        // キーボードが出るときに画面自体が動くので、
        // それを「スクロールした」と誤判定しないよう、落ち着いてから基準を取る
        onFocus={() => {
          window.setTimeout(() => {
            baseY.current = window.scrollY;
          }, 400);
        }}
        onBlur={() => {
          baseY.current = null;
        }}
        // 変換中はここが true。この間は検索しない
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          setQuery(e.currentTarget.value); // 確定した瞬間に検索
        }}
        onChange={(e) => {
          setValue(e.target.value); // 表示は常に更新する
          if (!composing.current) setQuery(e.target.value);
        }}
        className="block w-full rounded-input bg-neutral-field px-4 py-4 text-body text-ink-primary placeholder:text-ink-placeholder focus:outline-none"
      />
    </form>
  );
}
