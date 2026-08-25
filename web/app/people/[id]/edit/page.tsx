import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PersonForm from "@/components/PersonForm";
import { updatePerson, deletePerson } from "./actions";

export const metadata: Metadata = { title: "お客さんを編集｜おぼえがき" };

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: person }, { data }] = await Promise.all([
    supabase
      .from("people")
      .select(
        "id, name, name_kana, age_group, gender, appearance, company, position",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("people").select("company").not("company", "is", null),
  ]);
  if (!person) notFound();
  const companies = [
    ...new Set((data ?? []).map((r) => r.company as string)),
  ].sort();

  return (
    <main className="mx-auto w-full max-w-[390px] px-5 pt-8">
      <header className="flex items-center gap-4 border-b border-line-form pb-5">
        <Link
          href={`/people/${person.id}`}
          className="text-action text-accent-500"
        >
          戻る
        </Link>
        <h1 className="text-header text-ink-primary">お客さんを編集</h1>
      </header>

      <PersonForm
        companies={companies}
        action={updatePerson}
        submitLabel="保存する"
        person={{
          id: person.id as string,
          name: person.name as string,
          name_kana: person.name_kana as string | null,
          age_group: person.age_group as string | null,
          gender: person.gender as string | null,
          appearance: person.appearance as string | null,
          company: person.company as string | null,
          position: person.position as string | null,
        }}
      />

      {/* 削除は2段階。1タップで消えないようにする */}
      <details className="mb-32 mt-4 rounded-input border border-line-form px-4 py-3">
        <summary className="cursor-pointer text-action text-ink-secondary">
          このお客さんを削除
        </summary>
        <p className="mt-3 text-sub text-danger-600">
          会話の記録もすべて消えます。元に戻せません。
        </p>
        <form action={deletePerson} className="mt-3">
          <input type="hidden" name="id" value={person.id as string} />
          <button
            type="submit"
            className="w-full rounded-btn bg-danger-500 py-3 text-action font-bold text-neutral-card"
          >
            削除する
          </button>
        </form>
      </details>
    </main>
  );
}
