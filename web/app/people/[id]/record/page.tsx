import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecordForm from "./RecordForm";

export const metadata: Metadata = { title: "記録する｜おぼえがき" };

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 4本を同時に投げる。順に await すると往復が4回になる
  const [
    { data: person },
    { data: masters },
    { data: topics },
    { data: keywords },
  ] = await Promise.all([
    supabase.from("people").select("id, name").eq("id", id).maybeSingle(),
    // 話題マスタ全件。初期マスタ（user_id IS NULL）＋ 自分で作ったものを RLS が返す
    supabase.from("topic_masters").select("id, name, sort_order").order("sort_order"),
    // このお客さんとの実績。records(count) で子テーブルの件数を一緒に取る
    supabase.from("topics").select("topic_master_id, records(count)").eq("person_id", id),
    // キーワードは全顧客横断・使用回数順（§9 S-08）
    supabase.from("keywords").select("id, name, records(count)"),
  ]);
  if (!person) notFound();

  const counts = new Map<string, number>();
  for (const t of topics ?? []) {
    const c =
      (t.records as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
    counts.set(t.topic_master_id as string, c);
  }

  // §6 の2段階：話した回数の多い順 → 同数なら sort_order 順
  const chips = [...(masters ?? [])].sort((a, b) => {
    const ca = counts.get(a.id) ?? 0;
    const cb = counts.get(b.id) ?? 0;
    if (ca !== cb) return cb - ca;
    return a.sort_order - b.sort_order;
  });

  const keywordOptions = (keywords ?? [])
    .map((k) => ({
      name: k.name as string,
      count:
        (k.records as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── ここから下は段階 C で RecordForm に差し替える確認用の表示 ──
  return (
    <RecordForm
      personId={person.id}
      personName={person.name}
      chips={chips.map((c) => ({ id: c.id, name: c.name }))}
      keywordOptions={keywordOptions}
    />
  );
}
