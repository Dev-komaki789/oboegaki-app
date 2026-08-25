import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PersonForm from "@/components/PersonForm";
import { createPerson } from "./actions";
import BackLink from "@/components/BackLink";

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
    <main className="mx-auto w-full max-w-[390px] px-5 pt-8">
      <header className="flex items-center gap-4 border-b border-line-form pb-5">
        <BackLink fallback="/people" className="text-action text-accent-500">
          戻る
        </BackLink>
        <h1 className="text-header text-ink-primary">新しいお客さん</h1>
      </header>

      <PersonForm companies={companies} action={createPerson} />
    </main>
  );
}
