"use server";

import { redirect, RedirectType } from "next/navigation";
import { revalidatePath } from "next/cache";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { topicScoreUndecayed, type Rec } from "@/lib/score";

export type RecordState = { error?: string; savedAt?: number };

/**
 * talked_at を決める。深夜は前日扱い（午前4時まで・M-11）。
 * 23時に閉店して、日付が変わってから記録することがあるため。
 */
function talkedAtToday(): string {
  const now = new Date();
  const d = new Date(now);
  if (now.getHours() < 4) d.setDate(d.getDate() - 1);
  return format(d, "yyyy-MM-dd");
}

export async function saveRecord(
  _prev: RecordState,
  formData: FormData,
): Promise<RecordState> {
  const personId = String(formData.get("person_id") ?? "");
  const topicMasterId = String(formData.get("topic_master_id") ?? "").trim();
  const newTopicName = String(formData.get("new_topic_name") ?? "").trim();
  const keywordName = String(formData.get("keyword") ?? "").trim();
  const score = Number(formData.get("score"));
  const isNg = formData.get("is_ng") === "on";
  const intent = String(formData.get("intent") ?? "close"); // close | next

  // 「＋ もう1つ書く」で増えた分。同じ name なので getAll で全部取れる
  const contents = formData
    .getAll("content")
    .map((v) => String(v).trim())
    .filter(Boolean);

  if (!personId) return { error: "お客さんが特定できません。" };
  if (!topicMasterId && !newTopicName)
    return { error: "話題を選んでください。" };
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return { error: "盛り上がりの値が不正です。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 1. 話題マスタ ──────────────────────────────
  // 「新規登録ボタン」は置かない。既存にあれば選択、なければ作成。
  // 判定はシステム側が行う（§6）
  let masterId = topicMasterId;
  if (!masterId) {
    const { data: found } = await supabase
      .from("topic_masters")
      .select("id")
      .eq("name", newTopicName)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .limit(1)
      .maybeSingle();

    if (found) {
      masterId = found.id;
    } else {
      const { data, error } = await supabase
        .from("topic_masters")
        .insert({ user_id: user.id, name: newTopicName })
        .select("id")
        .single();
      if (error) return { error: `話題を作れませんでした：${error.message}` };
      masterId = data.id;
    }
  }

  // ── 1'. キーワード（任意）──────────────────────
  let keywordId: string | null = null;
  if (keywordName) {
    const { data: found } = await supabase
      .from("keywords")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", keywordName)
      .maybeSingle();

    if (found) {
      keywordId = found.id;
    } else {
      const { data, error } = await supabase
        .from("keywords")
        .insert({ user_id: user.id, name: keywordName })
        .select("id")
        .single();
      if (error)
        return { error: `キーワードを作れませんでした：${error.message}` };
      keywordId = data.id;
    }
  }

  // ── 2. topics（人 × 話題）= バブル1個 ───────────
  let topicId: string;
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("person_id", personId)
    .eq("topic_master_id", masterId)
    .maybeSingle();

  if (topic) {
    topicId = topic.id;
  } else {
    const { data, error } = await supabase
      .from("topics")
      .insert({ person_id: personId, topic_master_id: masterId })
      .select("id")
      .single();
    if (error) return { error: `話題を作れませんでした：${error.message}` };
    topicId = data.id;
  }

  const talkedAt = talkedAtToday();

  // ── 3. records（内容が2件なら2レコード・score は同じ値）───
  const rows = (contents.length > 0 ? contents : [null]).map((content) => ({
    person_id: personId,
    topic_id: topicId,
    keyword_id: keywordId,
    score,
    content,
    talked_at: talkedAt,
  }));

  const { error: insErr } = await supabase.from("records").insert(rows);
  if (insErr) return { error: `保存できませんでした：${insErr.message}` };

  // ── 4. topics.score を再計算（減衰前の集約値を保存）───
  const { data: all } = await supabase
    .from("records")
    .select("keyword_id, score, talked_at")
    .eq("topic_id", topicId);

  const recs: Rec[] = (all ?? []).map((r) => ({
    keywordId: r.keyword_id,
    score: r.score,
    talkedAt: parseISO(r.talked_at),
  }));
  const newScore = topicScoreUndecayed(recs) ?? 0;

  // ── 5 / 7. topics を更新 ────────────────────────
  await supabase
    .from("topics")
    .update({
      score: Number(newScore.toFixed(2)),
      last_talked_at: talkedAt,
      ...(isNg ? { is_ng: true } : {}),
    })
    .eq("id", topicId);

  // ── 6. people.last_talked_at ───────────────────
  await supabase
    .from("people")
    .update({ last_talked_at: talkedAt })
    .eq("id", personId);

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);

  // 「保存して、次を書く」は同じ画面に留まる（§6）
  if (intent === "next") return { savedAt: Date.now() };

  redirect(`/people/${personId}`, RedirectType.replace);
}
