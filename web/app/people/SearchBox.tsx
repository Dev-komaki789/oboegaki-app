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

  return (
    // JavaScript が動く前でも Enter で検索できるよう form は残す
    <form action="/people" className="mt-5">
      <input
        type="search"
        name="q"
        value={value}
        placeholder="名前・見た目・会社名で検索"
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
