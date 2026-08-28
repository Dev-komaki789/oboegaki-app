"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toBadges, sinceLabel } from "@/lib/person";

type Person = {
  id: string;
  name: string;
  name_kana: string | null;
  age_group: string | null;
  gender: string | null;
  appearance: string | null;
  last_talked_at: string | null;
};

/**
 * タブレット（iPad ランドスケープ）の左340pxの一覧（§8）。
 *
 * layout.tsx から呼ぶが、layout は searchParams を受け取れないので、
 * ここだけブラウザ側の Supabase クライアントで取りに行く。
 * RLS はブラウザのセッションでも同じように効く。
 */
export default function PeopleSidebar() {
  const pathname = usePathname();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [q, setQ] = useState("");

  // いま開いているお客さん（/people/<id>/… から取る）
  const activeId = pathname.split("/")[2] ?? "";

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase
      .from("people")
      .select("id, name, name_kana, age_group, gender, appearance, last_talked_at")
      .order("last_talked_at", { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        if (alive) setPeople((data ?? []) as Person[]);
      });
    return () => {
      alive = false;
    };
    // 登録・編集・削除のあとに開き直したとき取り直す
  }, [pathname]);

  const list = (people ?? []).filter((p) => {
    if (!q.trim()) return true;
    const hay = [p.name, p.name_kana, p.appearance].filter(Boolean).join(" ");
    return hay.includes(q.trim());
  });

  return (
    <div className="flex h-dvh flex-col border-r border-line-card">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-btn bg-accent-500 text-name text-neutral-card">
            記
          </span>
          <span className="text-header text-ink-primary">おぼえがき</span>
          <span className="ml-auto text-sub text-ink-secondary">
            {people ? `${list.length}人` : ""}
          </span>
        </div>

        {/* サイドバーの検索はこの一覧だけを絞る。URL は変えない
            （右ペインの内容まで切り替わってしまうため） */}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="名前・見た目・会社名で検索"
          className="mt-4 block w-full rounded-input bg-neutral-field px-4 py-3 text-body text-ink-primary placeholder:text-ink-placeholder focus:outline-none"
        />
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {people === null ? (
          <div className="space-y-2 px-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-card bg-neutral-chip"
              />
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {list.map((p) => {
              const on = p.id === activeId;
              const badges = toBadges(p);
              return (
                <li key={p.id}>
                  <Link
                    href={`/people/${p.id}`}
                    prefetch={true}
                    className={
                      "block rounded-card p-3 " +
                      (on
                        ? "border border-line-card bg-neutral-card"
                        : "border border-transparent")
                    }
                  >
                    <div className="flex gap-3">
                      <span
                        className={
                          "flex size-11 shrink-0 items-center justify-center rounded-btn text-name " +
                          (on
                            ? "bg-accent-500 text-neutral-card"
                            : "bg-accent-tint text-accent-ink")
                        }
                      >
                        {p.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        {p.name_kana && (
                          <p className="truncate text-caption text-ink-secondary">
                            {p.name_kana}
                          </p>
                        )}
                        <p className="truncate text-name text-ink-primary">
                          {p.name}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sub font-bold text-accent-500">
                          {sinceLabel(p.last_talked_at)}
                        </div>
                        {p.last_talked_at && (
                          <div className="text-caption text-ink-muted">
                            {format(parseISO(p.last_talked_at), "yyyy/MM/dd")}
                          </div>
                        )}
                      </div>
                    </div>
                    {badges.length > 0 && (
                      <div className="mt-2 flex max-h-16 flex-wrap gap-1.5 overflow-hidden pl-14">
                        {badges.map((b, i) => (
                          <span
                            key={i}
                            className="shrink-0 whitespace-nowrap rounded-full bg-neutral-chip px-2 py-0.5 text-caption leading-5 text-ink-tertiary"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-line-card p-4">
        <Link
          href="/people/new"
          className="block w-full rounded-btn bg-ink-primary py-3 text-center text-body font-bold text-neutral-card"
        >
          ＋ 新しいお客さん
        </Link>
      </div>
    </div>
  );
}
