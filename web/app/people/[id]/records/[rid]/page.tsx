import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import AppHeader from "@/components/AppHeader";
import Disclosure from "@/components/Disclosure";
import RecordEditForm from "./RecordEditForm";
import { deleteRecord } from "./actions";

export const metadata: Metadata = { title: "記録を修正｜おぼえがき" };

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string; rid: string }>;
}) {
  const { id, rid } = await params;
  const supabase = await createClient();

  // person_id も条件に入れる。URL を書き換えて他人の記録を開けないように
  const { data: record } = await supabase
    .from("records")
    .select(
      "id, person_id, topic_id, score, content, talked_at, topics(topic_masters(name)), keywords(name)",
    )
    .eq("id", rid)
    .eq("person_id", id)
    .maybeSingle();
  if (!record) notFound();

  const topicName =
    (
      (
        record.topics as unknown as {
          topic_masters: { name: string } | null;
        } | null
      )?.topic_masters ?? null
    )?.name ?? "（不明）";
  const keywordName =
    (record.keywords as unknown as { name: string } | null)?.name ?? null;

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 pt-8">
      <AppHeader left={<BackLink fallback={`/people/${id}`}>戻る</BackLink>} />
      <h1 className="mt-5 border-b border-line-form pb-5 text-header text-ink-primary">
        記録を修正
      </h1>

      {/* 変えられないものを先に見せる。日付と話題は記録の「身元」なので触らない */}
      <dl className="mt-5 card-soft rounded-card border border-line-card bg-neutral-card p-4">
        <div className="flex gap-4">
          <dt className="w-20 shrink-0 text-sub text-ink-secondary">日付</dt>
          <dd className="text-body text-ink-primary">
            {format(parseISO(record.talked_at as string), "yyyy/MM/dd")}
          </dd>
        </div>
        <div className="mt-2 flex gap-4">
          <dt className="w-20 shrink-0 text-sub text-ink-secondary">話題</dt>
          <dd className="text-body text-ink-primary">{topicName}</dd>
        </div>
        {keywordName && (
          <div className="mt-2 flex gap-4">
            <dt className="w-20 shrink-0 text-sub text-ink-secondary">
              キーワード
            </dt>
            <dd className="text-body text-ink-primary">{keywordName}</dd>
          </div>
        )}
      </dl>

      <RecordEditForm
        recordId={record.id as string}
        personId={record.person_id as string}
        topicId={record.topic_id as string}
        initialScore={record.score as number}
        initialContent={(record.content as string | null) ?? ""}
      />

      {/* 削除は2段階。1タップで消えないようにする */}
      <Disclosure
        summary="この記録を削除"
        className="mb-32 mt-4 rounded-input border border-line-form px-4 py-3 lg:mb-10"
        summaryClassName="cursor-pointer text-action text-ink-secondary"
      >
        <p className="mt-3 text-sub text-danger-600">
          元に戻せません。話題の記録がこれだけだった場合、話題ごと消えます。
        </p>
        <form action={deleteRecord} className="mt-3">
          <input type="hidden" name="id" value={record.id as string} />
          <input
            type="hidden"
            name="person_id"
            value={record.person_id as string}
          />
          <input
            type="hidden"
            name="topic_id"
            value={record.topic_id as string}
          />
          <button
            type="submit"
            className="w-full rounded-btn bg-danger-500 py-3 text-action font-bold text-neutral-card"
          >
            削除する
          </button>
        </form>
      </Disclosure>
    </main>
  );
}
