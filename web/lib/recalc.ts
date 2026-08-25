import { parseISO } from "date-fns";
import { topicScoreUndecayed, type Rec } from "@/lib/score";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * ある話題の records から topics.score と last_talked_at を計算し直す（§6 の④⑤）。
 * 記録の保存・修正・削除のあと、必ずこれを通す。
 *
 * topics.score に入れるのは減衰前の集約値。減衰は表示のたびにかけ直す（開発ログ 03）
 */
export async function recalcTopic(supabase: Client, topicId: string) {
  const { data } = await supabase
    .from("records")
    .select("keyword_id, score, talked_at")
    .eq("topic_id", topicId);

  const rows = data ?? [];

  // 記録が1件も無くなった話題は残さない。
  // 残すとスコア0の泡がバブルに居座り、枠を1つ無駄にする
  if (rows.length === 0) {
    await supabase.from("topics").delete().eq("id", topicId);
    return;
  }

  const recs: Rec[] = rows.map((r) => ({
    keywordId: r.keyword_id as string | null,
    score: r.score as number,
    talkedAt: parseISO(r.talked_at as string),
  }));

  const score = topicScoreUndecayed(recs) ?? 0;
  const last = rows
    .map((r) => r.talked_at as string)
    .sort()
    .at(-1)!;

  await supabase
    .from("topics")
    .update({ score: Number(score.toFixed(2)), last_talked_at: last })
    .eq("id", topicId);
}

/**
 * people.last_talked_at を records から引き直す（§6 の⑥）。
 * 記録を消したときに、最終来店日が実態とずれるのを防ぐ
 */
export async function recalcPerson(supabase: Client, personId: string) {
  const { data } = await supabase
    .from("records")
    .select("talked_at")
    .eq("person_id", personId)
    .order("talked_at", { ascending: false })
    .limit(1);

  const last = (data ?? [])[0]?.talked_at ?? null;
  await supabase
    .from("people")
    .update({ last_talked_at: last })
    .eq("id", personId);
}
