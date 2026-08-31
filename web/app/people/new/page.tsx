import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PersonForm from "@/components/PersonForm";
import { createPerson } from "./actions";
import BackLink from "@/components/BackLink";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = { title: "新しいお客さん｜おぼえがき" };

export default async function NewPersonPage() {
  const supabase = await createClient();

  // 会社名のサジェスト用。自分の登録済みの会社名を集める（RLS が自動で絞る）
  const { data } = await supabase
    .from("people")
    .select("company")
    .not("company", "is", null);

  const companies = [
    ...new Set((data ?? []).map((r) => r.company as string)),
  ].sort();

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 pt-8">
      <AppHeader left={<BackLink fallback="/people">戻る</BackLink>} />
      <h1 className="mt-5 border-b border-line-form pb-5 text-header text-ink-primary">
        新しいお客さん
      </h1>

      <PersonForm companies={companies} action={createPerson} />
    </main>
  );
}
