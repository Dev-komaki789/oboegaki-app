import BubbleChart from "@/components/BubbleChart";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { topicScore, type Rec } from "@/lib/score";
import BackLink from "@/components/BackLink";

export default async function TopicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 4本を同時に投げる。順に await すると往復が4回になる
  const [
    { data: person },
    { data: topics },
    { data: rawRecords },
    { data: masters },
  ] = await Promise.all([
    supabase
      .from("people")
      .select("id, name, last_talked_at")
      .eq("id", id)
      .maybeSingle(),
    // NG は除く（§9 S-06）。NG は情報タブのバナーで常時警告している
    supabase
      .from("topics")
      .select("id, topic_master_id, last_talked_at, topic_masters(name)")
      .eq("person_id", id)
      .eq("is_ng", false),
    supabase
      .from("records")
      .select("topic_id, keyword_id, score, talked_at")
      .eq("person_id", id),
    supabase
      .from("topic_masters")
      .select("id, name, sort_order")
      .order("sort_order"),
  ]);
  if (!person) notFound();

  const byTopic = new Map<string, Rec[]>();
  for (const r of rawRecords ?? []) {
    const key = r.topic_id as string;
    const list = byTopic.get(key) ?? [];
    list.push({
      keywordId: r.keyword_id as string | null,
      score: r.score as number,
      talkedAt: parseISO(r.talked_at as string),
    });
    byTopic.set(key, list);
  }

  const today = new Date();

  // ★ topics.score は減衰前の値。そのまま並べると順位が入れ替わるので、
  //   表示値（減衰後）を計算し直してから並べる（§9 S-06）
  const rows = (topics ?? [])
    .map((t) => ({
      id: t.id as string,
      name:
        (t.topic_masters as unknown as { name: string } | null)?.name ??
        "（不明）",
      lastTalkedAt: t.last_talked_at as string | null,
      score: topicScore(byTopic.get(t.id as string) ?? [], today) ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const max = rows[0]?.score ?? 0;
  // バブルは実線10個で固定。表示値で再ソートしたあとの上位10件（§9 S-06）
  const bubbles = rows.slice(0, 10).map((r) => ({
    id: r.id,
    name: r.name,
    score: r.score,
    lastLabel: r.lastTalkedAt
      ? format(parseISO(r.lastTalkedAt), "yyyy/MM/dd")
      : null,
  }));

  // まだ話していない話題（§9 S-06）
  const usedMasterIds = new Set(
    (topics ?? []).map((t) => t.topic_master_id as string),
  );
  const untouched = (masters ?? [])
    .filter((m) => !usedMasterIds.has(m.id as string))
    .slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-[430px] px-5 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <BackLink fallback="/people">お客さん一覧</BackLink>
        <span className="text-sub text-ink-secondary">{person.name}</span>
      </header>

      <div className="mt-4 flex rounded-input bg-neutral-chip p-1">
        <Link
          href={`/people/${person.id}`}
          replace
          prefetch={true}
          className="flex-1 py-3 text-center text-action text-ink-secondary"
        >
          お客さん情報
        </Link>
        <span className="flex-1 rounded-[10px] bg-neutral-card py-3 text-center text-action font-bold text-ink-primary">
          話題
        </span>
      </div>

      <p className="mt-4 text-sub text-ink-muted">大きいほど盛り上がった</p>

      <BubbleChart personId={person.id} items={bubbles} />

      {untouched.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sub text-ink-secondary">
            まだ話していない：
          </span>
          {untouched.map((m) => (
            <span
              key={m.id as string}
              className="rounded-full border border-line-card bg-neutral-card px-3 py-1 text-sub text-ink-tertiary"
            >
              {m.name as string}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-8 flex items-baseline justify-between">
        <span className="text-name text-ink-primary">盛り上がった順</span>
        <span className="text-sub text-ink-secondary">全{rows.length}件</span>
      </h2>

      {rows.length === 0 ? (
        <p className="mt-6 text-center text-body text-ink-secondary">
          まだ記録がありません。
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/people/${person.id}/topics/${r.id}`}
                prefetch={true}
                className="block rounded-card border border-line-card bg-neutral-card p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-name text-ink-primary">{r.name}</span>
                  <span className="text-name font-bold text-accent-500">
                    {Math.round(r.score)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-chip">
                  <div
                    className="h-full rounded-full bg-accent-500"
                    style={{
                      width: `${max > 0 ? (r.score / max) * 100 : 0}%`,
                    }}
                  />
                </div>
                {r.lastTalkedAt && (
                  <div className="mt-2 text-caption text-ink-muted">
                    前回 {format(parseISO(r.lastTalkedAt), "yyyy/MM/dd")}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-5 pb-6">
        <Link
          href={`/people/${person.id}/record`}
          className="block w-full rounded-btn bg-ink-primary py-4 text-center text-body font-bold text-neutral-card"
        >
          ＋ 記録する
        </Link>
      </div>
    </main>
  );
}
