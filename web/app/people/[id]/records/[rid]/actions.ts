"use server";

import { redirect, RedirectType } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recalcTopic, recalcPerson } from "@/lib/recalc";

export type RecordEditState = { error?: string };

/**
 * 1件の記録を修正する。
 * 変えられるのは盛り上がりと内容だけ。日付・話題・キーワードは変えない
 * （変えると「別の記録」になり、EMA の履歴としての意味が壊れる）
 */
export async function updateRecord(
  _prev: RecordEditState,
  formData: FormData,
): Promise<RecordEditState> {
  const id = String(formData.get("id") ?? "");
  const personId = String(formData.get("person_id") ?? "");
  const topicId = String(formData.get("topic_id") ?? "");
  const score = Number(formData.get("score"));
  const contentRaw = String(formData.get("content") ?? "").trim();

  if (!id || !personId || !topicId) return { error: "記録が特定できません。" };
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return { error: "盛り上がりの値が不正です。" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("records")
    .update({ score, content: contentRaw === "" ? null : contentRaw })
    .eq("id", id);

  if (error) return { error: `保存できませんでした：${error.message}` };

  // §6 の④⑤。スコアを変えたら話題スコアも計算し直す
  await recalcTopic(supabase, topicId);

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  redirect(`/people/${personId}`, RedirectType.replace);
}

export async function deleteRecord(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const personId = String(formData.get("person_id") ?? "");
  const topicId = String(formData.get("topic_id") ?? "");
  if (!id || !personId || !topicId) return;

  const supabase = await createClient();
  await supabase.from("records").delete().eq("id", id);

  // 消した結果、その話題の記録が0件になれば話題ごと消える（recalcTopic）
  await recalcTopic(supabase, topicId);
  await recalcPerson(supabase, personId);

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  redirect(`/people/${personId}`, RedirectType.replace);
}
