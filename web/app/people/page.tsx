import { createClient } from "@/lib/supabase/server";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

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

export default async function PeoplePage() {
  const supabase = await createClient();

  // user_id での絞り込みは書かない。RLS が自動でやる
  const { data: people, error } = await supabase
    .from("people")
    .select(
      "id, name, name_kana, age_group, gender, appearance, last_talked_at",
    )
    .order("last_talked_at", { ascending: false, nullsFirst: false });

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

      {/* TODO(Day2): 検索を配線する。いまは見た目だけ */}
      <div className="mt-5 rounded-input bg-neutral-field px-4 py-4 text-body text-ink-placeholder">
        名前・見た目・会社名で検索
      </div>

      {list.length === 0 ? (
        <p className="mt-10 text-center text-body text-ink-secondary">
          お客さんがまだ登録されていません。
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((p) => {
            const badges = toBadges(p);
            return (
              <li
                key={p.id}
                className="flex gap-4 rounded-card border border-line-card bg-neutral-card p-4"
              >
                <div className="flex size-14 shrink-0 items-center justify-center rounded-btn bg-accent-500 text-header text-neutral-card">
                  {p.name.trim().charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-name text-ink-primary">{p.name}</span>
                    <span className="text-sub text-ink-secondary">
                      {p.name_kana}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {badges.map((b, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-neutral-chip px-3 py-1 text-sub text-ink-tertiary"
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
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[390px] px-5 pb-6">
        <button className="w-full rounded-btn bg-ink-primary py-4 text-body font-bold text-neutral-card">
          ＋ 新しいお客さん
        </button>
      </div>
    </main>
  );
}
