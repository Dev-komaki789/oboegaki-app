"use server";

import { redirect, RedirectType } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PersonState = { error?: string };

export async function createPerson(
  _prev: PersonState,
  formData: FormData,
): Promise<PersonState> {
  const name = String(formData.get("name") ?? "").trim();

  // 必須は名前だけ（§9 S-03）
  if (!name) {
    return { error: "名前を入力してください。" };
  }

  const supabase = await createClient();

  // 読むときと違い、insert では「誰のデータか」を自分で入れる必要がある。
  // RLS の with check (user_id = auth.uid()) を満たすため
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /** 空文字は null にする。DB には「未入力」を空文字ではなく null で入れる */
  const pick = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const { error } = await supabase.from("people").insert({
    user_id: user.id,
    name,
    name_kana: pick("name_kana"),
    age_group: pick("age_group"),
    gender: pick("gender"),
    appearance: pick("appearance"), // 「、」区切りのまま保存。分割は表示時だけ
    company: pick("company"),
    position: pick("position"),
  });

  if (error) {
    return { error: `登録できませんでした：${error.message}` };
  }

  revalidatePath("/people");
  redirect("/people", RedirectType.replace);
}
