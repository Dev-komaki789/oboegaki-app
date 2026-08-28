import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ModeTabs from "@/components/ModeTabs";
import Timeline from "./Timeline";
import ByTopicList from "./ByTopicList";
import BackLink from "@/components/BackLink";
import type { RecordRow } from "@/lib/person";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

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
    <main className="mx-auto w-full max-w-[430px] px-5 pb-28 pt-8 lg:max-w-none lg:px-8 lg:pb-10">
      {/* タブレットでは左の一覧が常に見えているので「お客さん一覧」は要らない。
          代わりに「記録する」を右上に出す（下部固定だと右ペインの端に寄る）*/}
      <header className="flex items-center justify-between lg:hidden">
        {/* 履歴を実際に縮められるのは pop（router.back）だけ。
            replace は一番上を差し替えるだけなので、往復するたびに
            スタックが伸びていく。
            タブを replace にしてあるので、pop を辿れば必ず一覧に着く */}
        <BackLink fallback="/people">お客さん一覧</BackLink>
        <Link
          href={`/people/${person.id}/edit`}
          className="text-action text-accent-500"
        >
          編集
        </Link>
      </header>

      <div className="mt-3 lg:mt-0 lg:flex lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="text-title">{person.name}</h1>
            <span className="text-sub text-ink-secondary">
              {person.name_kana}
            </span>
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
        </div>

        <div className="hidden shrink-0 items-center gap-5 lg:flex">
          <Link
            href={`/people/${person.id}/edit`}
            className="text-action text-accent-500"
          >
            編集
          </Link>
          <Link
            href={`/people/${person.id}/record`}
            prefetch={true}
            className="rounded-btn bg-ink-primary px-6 py-3 text-body font-bold text-neutral-card"
          >
            ＋ 記録する
          </Link>
        </div>
      </div>

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
        <dl className="mt-2 lg:mt-3 lg:flex lg:gap-10">
          {profile
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="mt-2 flex gap-4 lg:mt-0 lg:block">
                <dt className="w-20 shrink-0 text-sub text-ink-secondary">
                  {k}
                </dt>
                <dd className="text-body text-ink-primary lg:mt-1">{v}</dd>
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
            <ByTopicList
              groups={[...groups.values()]}
              latestVisit={latestVisit}
            />
          }
          timeline={
            <Timeline
              personId={person.id}
              records={records}
              latestVisit={latestVisit}
            />
          }
        />
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-5 pb-6 lg:hidden">
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
