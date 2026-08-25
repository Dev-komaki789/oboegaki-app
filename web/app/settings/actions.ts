"use server";

import { redirect, RedirectType } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // ログイン状態が変わったので、キャッシュを捨てて作り直させる
  revalidatePath("/", "layout");
  redirect("/login", RedirectType.replace);
}
