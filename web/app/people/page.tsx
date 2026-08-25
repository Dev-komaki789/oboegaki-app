import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import SearchBox from "./SearchBox";

/** 年代・性別を1つにまとめ、見た目の特徴を「、」で分割してバッジの配列にする */
function toBadges(p: {
  age_group: string | null;
  gender: string | null;
  appearance: string | null;
}) {
  const list: string[] = [];
  const ageGender = [p.age_group, p.gender].filter(Boolean).join(" ");
  if (ageGender) list.push(ageGender);
  if (p.appearance) {
    list.push(
      ...p.appearance
        .split(/[、,，・]/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  return list;
}

/** 「3日前」を作る。今日なら「今日」 */
function sinceLabel(d: string | null) {
  if (!d) return null;
  const days = differenceInCalendarDays(new Date(), parseISO(d));
  if (days <= 0) return "今日";
  return `${days}日前`;
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Next.js 15 では searchParams も非同期。cookies() と同じ
  const { q = "" } = await searchParams;
  const keyword = q.trim();

  const supabase = await createClient();

  // user_id での絞り込みは書かない。RLS が自動でやる
  let query = supabase
    .from("people")
    .select(
      "id, name, name_kana, age_group, gender, appearance, last_talked_at",
    )
    .order("last_talked_at", { ascending: false, nullsFirst: false });

  // 名前・よみがな・見た目・会社名の4項目を横断（§9 S-02）。役職は含めない
  if (keyword) {
    // PostgREST の or は「,」で条件を区切る。検索語に「,()」が入ると
    // 構文が壊れるので、先に落としておく
    const safe = keyword.replace(/[,()%*]/g, " ").trim();
    if (safe) {
      query = query.or(
        [
          `name.ilike.%${safe}%`,
          `name_kana.ilike.%${safe}%`,
          `appearance.ilike.%${safe}%`,
          `company.ilike.%${safe}%`,
        ].join(","),
      );
    }
  }

  const { data: people, error } = await query;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[390px] px-5 py-8">
        <p className="rounded-input border border-danger-border bg-danger-tint px-4 py-3 text-label text-danger-600">
          読み込みに失敗しました：{error.message}
        </p>
      </main>
    );
  }

  const list = people ?? [];

  return (
    <main className="mx-auto w-full max-w-[390px] px-5 pb-28 pt-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-title">お客さん</h1>
        <span className="text-sub text-ink-secondary">{list.length}人</span>
      </header>

      {/* 窓は1つ。4項目を横断する。autoFocus は付けない（M-05） */}
      <SearchBox initialQuery={keyword} />

      {list.length === 0 ? (
        <p className="mt-10 text-center text-body text-ink-secondary">
          {keyword
            ? `「${keyword}」に一致するお客さんはいません。`
            : "お客さんがまだ登録されていません。"}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((p) => {
            const badges = toBadges(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/people/${p.id}`}
                  className="flex gap-4 rounded-card border border-line-card bg-neutral-card p-4"
                >
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-btn bg-accent-500 text-header text-neutral-card">
                    {p.name.trim().charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-name text-ink-primary">
                        {p.name}
                      </span>
                      <span className="text-sub text-ink-secondary">
                        {p.name_kana}
                      </span>
                    </div>

                    {/*
                    バッジは最大2行（§9 S-02）。
                      1個の高さ = py-1(8px) + leading-5(20px) = 28px
                      2行分     = 28 * 2 + gap-2(8px)         = 64px = max-h-16
                    3行目は 72px の位置から始まるので枠の完全に外。半分見えることはない。
                    折り返しはブラウザが計算するので、バッジ単体が途中で切れることはない。

                    ※ 仕様の「2行目にも収まらない場合は +N」は未実装。
                      文字幅をサーバー側で見積もる必要があり、割に合わないと判断した。
                      3行目以降は静かに隠れる。
                  */}
                    <div className="mt-2 flex max-h-16 flex-wrap gap-2 overflow-hidden">
                      {badges.map((b, i) => (
                        <span
                          key={i}
                          className="shrink-0 whitespace-nowrap rounded-full bg-neutral-chip px-3 py-1 text-sub leading-5 text-ink-tertiary"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-name font-bold text-accent-500">
                      {sinceLabel(p.last_talked_at)}
                    </div>
                    {p.last_talked_at && (
                      <div className="mt-1 text-caption text-ink-muted">
                        前回 {format(parseISO(p.last_talked_at), "yyyy/MM/dd")}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[390px] px-5 pb-6">
        <Link
          href="/people/new"
          className="block w-full rounded-btn bg-ink-primary py-4 text-center text-body font-bold text-neutral-card"
        >
          ＋ 新しいお客さん
        </Link>
      </div>
    </main>
  );
}
