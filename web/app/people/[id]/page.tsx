import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ModeTabs from "@/components/ModeTabs";
import BackLink from "@/components/BackLink";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

type RecordRow = {
  id: string;
  content: string | null;
  talked_at: string;
  topic_id: string;
  topicName: string;
};

function sinceLabel(d: string) {
  const n = differenceInCalendarDays(new Date(), parseISO(d));
  return n <= 0 ? "今日" : `${n}日前`;
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const byTopic = mode === "topic"; // 既定は時系列（§9 S-04）

  const supabase = await createClient();

  // 3本を同時に投げる。順に await すると往復が3回になる
  const [{ data: person }, { data: ngTopics }, { data: raw }] =
    await Promise.all([
      supabase
        .from("people")
        .select(
          "id, name, name_kana, age_group, gender, appearance, company, position, last_talked_at",
        )
        .eq("id", id)
        .maybeSingle(),
      // NG話題。タブの外側に常時表示する（専用ページに隠すと見ずに踏む）
      supabase
        .from("topics")
        .select("topic_masters(name)")
        .eq("person_id", id)
        .eq("is_ng", true),
      supabase
        .from("records")
        .select("id, content, talked_at, topic_id, topics(topic_masters(name))")
        .eq("person_id", id)
        .order("talked_at", { ascending: false }),
    ]);
  if (!person) notFound();

  const ngNames = (ngTopics ?? [])
    .map(
      (t) =>
        (t.topic_masters as unknown as { name: string } | null)?.name ?? "",
    )
    .filter(Boolean);

  const records: RecordRow[] = (raw ?? []).map((r) => ({
    id: r.id as string,
    content: r.content as string | null,
    talked_at: r.talked_at as string,
    topic_id: r.topic_id as string,
    topicName:
      (
        (
          r.topics as unknown as {
            topic_masters: { name: string } | null;
          } | null
        )?.topic_masters ?? null
      )?.name ?? "（不明）",
  }));

  // 【更新】ピルは「前回来店以降に追加された記録」に付く（§9）。
  // 最新の talked_at ＝ 今回の来店日 とみなす
  const latestVisit = records[0]?.talked_at ?? null;

  const appearanceList = String(person.appearance ?? "")
    .split(/[、,，・]/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  const summary = [
    [person.age_group, person.gender].filter(Boolean).join("・"),
    appearanceList.join("・"),
  ]
    .filter(Boolean)
    .join("／");

  // 空欄の項目は行ごと表示しない（§9 S-04）。美容師なら会社名・役職の行が消える
  const profile: [string, string][] = [
    [
      "年代・性別",
      [person.age_group, person.gender].filter(Boolean).join("・"),
    ],
    ["見た目", appearanceList.join("、")],
    ["会社名", person.company ?? ""],
    ["役職", person.position ?? ""],
  ];

  // 話題別タブ：content が空の記録は出さない（§9 S-04）
  const groups = new Map<string, { name: string; rows: RecordRow[] }>();
  for (const r of records) {
    if (!r.content) continue;
    const g = groups.get(r.topic_id) ?? { name: r.topicName, rows: [] };
    g.rows.push(r);
    groups.set(r.topic_id, g);
  }

  return (
    <main className="mx-auto w-full max-w-[390px] px-5 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <BackLink fallback="/people" className="text-action text-accent-500">
          お客さん一覧
        </BackLink>
        <Link
          href={`/people/${person.id}/edit`}
          className="text-action text-accent-500"
        >
          編集
        </Link>
      </header>

      <div className="mt-3 flex items-baseline gap-2">
        <h1 className="text-title">{person.name}</h1>
        <span className="text-sub text-ink-secondary">{person.name_kana}</span>
      </div>

      <p className="mt-1 text-sub text-ink-secondary">
        {summary}
        {person.last_talked_at && (
          <>
            {summary && "　"}最終{" "}
            {format(parseISO(person.last_talked_at), "yyyy/MM/dd")}（
            {sinceLabel(person.last_talked_at)}）
          </>
        )}
      </p>

      {/* NG警告：タブの外側に常時表示 */}
      {ngNames.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-input border-l-4 border-danger-500 bg-danger-tint px-4 py-3">
          <span className="text-label text-danger-500">⚠ 避ける話題</span>
          <span className="text-name font-bold text-danger-500">
            {ngNames.join(" / ")}
          </span>
        </div>
      )}

      {/* セグメンテッドコントロール（chip地の中に白いピル）*/}
      <div className="mt-4 flex rounded-input bg-neutral-chip p-1">
        <span className="flex-1 rounded-[10px] bg-neutral-card py-3 text-center text-action font-bold text-ink-primary">
          お客さん情報
        </span>
        <Link
          href={`/people/${person.id}/topics`}
          replace
          prefetch={true}
          className="flex-1 py-3 text-center text-action text-ink-secondary"
        >
          話題
        </Link>
      </div>

      <div className="mt-4 rounded-card border border-line-card bg-neutral-card p-4">
        <div className="text-label text-ink-secondary">プロフィール</div>
        <dl className="mt-2">
          {profile
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="mt-2 flex gap-4">
                <dt className="w-20 shrink-0 text-sub text-ink-secondary">
                  {k}
                </dt>
                <dd className="text-body text-ink-primary">{v}</dd>
              </div>
            ))}
        </dl>
      </div>

      {records.length === 0 ? (
        <p className="mt-10 text-center text-body text-ink-secondary">
          まだ記録がありません。
        </p>
      ) : (
        /* 両方サーバーで描いておいて、表示だけ切り替える。
           同じ records を並べ替えているだけなので往復が要らない */
        <ModeTabs
          initialMode={byTopic ? "topic" : "time"}
          basePath={`/people/${person.id}`}
          byTopic={
            <div className="mt-4 space-y-3">
              {[...groups.values()].map((g) => (
                <div
                  key={g.name}
                  className="rounded-card border border-line-card bg-neutral-card p-4"
                >
                  <div className="flex items-center gap-2 border-b border-line-faint pb-3">
                    <span className="text-name text-accent-500">{g.name}</span>
                    {g.rows.some((r) => r.talked_at === latestVisit) && (
                      <span className="rounded-full bg-accent-500 px-2 py-0.5 text-caption text-neutral-card">
                        更新
                      </span>
                    )}
                  </div>
                  {g.rows.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-baseline justify-between gap-3 border-b border-line-faint py-3 last:border-0 last:pb-0"
                    >
                      <span className="text-body text-ink-primary">{r.content}</span>
                      <span className="shrink-0 text-caption text-ink-muted">
                        {format(parseISO(r.talked_at), "yyyy/MM/dd")}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          }
          timeline={
            <ol className="mt-4">
              {records.map((r) => (
                <li key={r.id} className="flex gap-3">
                  <div className="w-[76px] shrink-0 pt-1 text-right text-caption text-ink-muted">
                    {format(parseISO(r.talked_at), "yyyy/MM/dd")}
                  </div>
                  <div className="relative flex w-3 shrink-0 justify-center">
                    <span className="absolute top-2 size-2 rounded-full bg-accent-300" />
                    <span className="w-px flex-1 bg-line-form" />
                  </div>
                  <div className="mb-3 flex-1 rounded-card border border-line-card bg-neutral-card p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-label text-accent-500">{r.topicName}</span>
                      {r.talked_at === latestVisit && (
                        <span className="rounded-full bg-accent-500 px-2 py-0.5 text-caption text-neutral-card">
                          更新
                        </span>
                      )}
                    </div>
                    {r.content && (
                      <p className="mt-1 text-body text-ink-primary">{r.content}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          }
        />
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[390px] px-5 pb-6">
        <Link
          href={`/people/${person.id}/record`}
          prefetch={true}
          className="block w-full rounded-btn bg-ink-primary py-4 text-center text-body font-bold text-neutral-card"
        >
          ＋ 記録する
        </Link>
      </div>
    </main>
  );
}
