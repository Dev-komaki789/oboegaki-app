import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { keywordDisplayValues, topicScore, NONE, type Rec } from "@/lib/score";
import BackLink from "@/components/BackLink";

/** 濃淡だけで順位を示す。数字は出さない（§9 S-07・判断15）
 *  文字色はコントラスト実測（開発ログ 05）に従う。白は bubble-4 だけ */
function shade(v: number) {
  if (v < 40) return "bg-bubble-1 text-accent-ink";
  if (v < 60) return "bg-bubble-2 text-accent-ink";
  if (v < 80) return "bg-bubble-3 text-ink-primary";
  return "bg-bubble-4 text-neutral-card";
}

export default async function TopicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; tid: string }>;
  searchParams: Promise<{ k?: string; all?: string }>;
}) {
  const { id, tid } = await params;
  const { k: filterKeyword, all } = await searchParams;
  const supabase = await createClient();

  const [{ data: topic }, { data: raw }] = await Promise.all([
    // person_id も条件に入れる。URL を書き換えて他人の話題を開けないように
    supabase
      .from("topics")
      .select("id, person_id, last_talked_at, topic_masters(name)")
      .eq("id", tid)
      .eq("person_id", id)
      .maybeSingle(),
    supabase
      .from("records")
      .select("id, keyword_id, score, content, talked_at, keywords(name)")
      .eq("topic_id", tid)
      .order("talked_at", { ascending: false }),
  ]);
  if (!topic) notFound();

  const topicName =
    (topic.topic_masters as unknown as { name: string } | null)?.name ??
    "（不明）";

  const rows = (raw ?? []).map((r) => ({
    id: r.id as string,
    keywordId: r.keyword_id as string | null,
    keywordName:
      (r.keywords as unknown as { name: string } | null)?.name ?? null,
    score: r.score as number,
    content: r.content as string | null,
    talkedAt: r.talked_at as string,
  }));

  const recs: Rec[] = rows.map((r) => ({
    keywordId: r.keywordId,
    score: r.score,
    talkedAt: parseISO(r.talkedAt),
  }));

  const today = new Date();
  const total = topicScore(recs, today) ?? 0;
  const values = keywordDisplayValues(recs, today);

  const nameById = new Map<string, string>();
  for (const r of rows)
    if (r.keywordId && r.keywordName) nameById.set(r.keywordId, r.keywordName);

  // 疑似枠 __none__ はチップに出さない。名前が無いため。
  // ただし話題スコアの計算には含まれている（§5・§9）
  const chips = [...values.entries()]
    .filter(([key]) => key !== NONE)
    .map(([key, v]) => ({ id: key, name: nameById.get(key) ?? "（不明）", v }))
    .sort((a, b) => b.v - a.v);

  const withContent = rows.filter((r) => r.content);
  const filtered = filterKeyword
    ? withContent.filter((r) => r.keywordId === filterKeyword)
    : withContent;
  const shown = all ? filtered : filtered.slice(0, 5);

  const base = `/people/${id}/topics/${tid}`;

  return (
    <main className="mx-auto w-full max-w-[430px] px-5 pb-28 pt-8">
      <BackLink
        fallback={`/people/${id}/topics`}
        className="text-action text-accent-500"
      >
        話題に戻る
      </BackLink>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title">{topicName}</h1>
          {topic.last_talked_at && (
            <p className="mt-1 text-sub text-ink-secondary">
              前回{" "}
              {format(parseISO(topic.last_talked_at as string), "yyyy/MM/dd")}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sub text-ink-secondary">盛り上がり</div>
          <div className="text-score font-bold text-accent-500">
            {Math.round(total)}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {chips.map((c) => {
              const on = filterKeyword === c.id;
              return (
                <Link
                  key={c.id}
                  href={on ? base : `${base}?k=${c.id}`}
                  className={
                    "rounded-full px-4 py-2 text-action " +
                    shade(c.v) +
                    (on ? " ring-2 ring-accent-500 ring-offset-2" : "")
                  }
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
          <p className="mt-2 text-sub text-ink-muted">
            キーワードをタップすると絞り込めます
          </p>
        </>
      )}

      <h2 className="mt-8 text-sub text-ink-secondary">話した内容</h2>

      {shown.length === 0 ? (
        <p className="mt-4 text-center text-body text-ink-secondary">
          {filterKeyword
            ? "このキーワードの記録はありません。"
            : "内容の記録はまだありません。"}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {shown.map((r) => (
            <li key={r.id}>
              <Link
                href={`/people/${id}/records/${r.id}`}
                className="flex items-center gap-3 rounded-card border border-line-card bg-neutral-card px-4 py-4"
              >
                <span className="w-[76px] shrink-0 text-caption text-ink-muted">
                  {format(parseISO(r.talkedAt), "yyyy/MM/dd")}
                </span>
                <span className="min-w-0 flex-1 text-body text-ink-primary">
                  {r.content}
                </span>
                {/* 明細の数字は records.score をそのまま。話題のスコア（32px）
                    より小さく、右端に。色は accent（モックアップ S-07） */}
                <span className="shrink-0 text-name text-accent-500">
                  {r.score}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!all && filtered.length > shown.length && (
        <div className="mt-3 text-center">
          <Link
            href={
              filterKeyword
                ? `${base}?k=${filterKeyword}&all=1`
                : `${base}?all=1`
            }
            className="text-action text-accent-500"
          >
            もっと見る（残り {filtered.length - shown.length} 件）
          </Link>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-5 pb-6">
        <Link
          href={`/people/${id}/record`}
          className="block w-full rounded-btn bg-ink-primary py-4 text-center text-body font-bold text-neutral-card"
        >
          ＋ 記録する
        </Link>
      </div>
    </main>
  );
}
