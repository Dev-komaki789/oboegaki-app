"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PersonState } from "@/lib/types";

export async function updatePerson(
  _prev: PersonState,
  formData: FormData,
): Promise<PersonState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!id) return { error: "お客さんが特定できません。" };
  if (!name) return { error: "名前を入力してください。" };

  const pick = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const supabase = await createClient();

  // user_id は触らない。RLS の using が他人の行を弾く
  const { error } = await supabase
    .from("people")
    .update({
      name,
      name_kana: pick("name_kana"),
      age_group: pick("age_group"),
      gender: pick("gender"),
      appearance: pick("appearance"),
      company: pick("company"),
      position: pick("position"),
    })
    .eq("id", id);

  if (error) return { error: `保存できませんでした：${error.message}` };

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}`);
}

export async function deletePerson(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // topics / records は on delete cascade で一緒に消える（§4）
  await supabase.from("people").delete().eq("id", id);

  revalidatePath("/people");
  redirect("/people");
}
