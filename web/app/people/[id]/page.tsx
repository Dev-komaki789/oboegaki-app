import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // searchParams と同じく、Next.js 15 では params も非同期
  const { id } = await params;

  const supabase = await createClient();

  // .single() と違い .maybeSingle() は、見つからないときエラーにならず null を返す
  const { data: person } = await supabase
    .from("people")
    .select("id, name, name_kana")
    .eq("id", id)
    .maybeSingle();

  // 他人のお客さんの id を打たれても、RLS が返さないのでここに来る
  if (!person) notFound();

  return (
    <main className="mx-auto w-full max-w-[390px] px-5 pb-28 pt-8">
      <header>
        <Link href="/people" className="text-action text-accent-500">
          お客さん一覧
        </Link>
      </header>

      <h1 className="mt-4 text-title">{person.name}</h1>
      <p className="mt-1 text-sub text-ink-secondary">{person.name_kana}</p>

      {/* TODO(S-04): NG警告バナー・プロフィールカード・時系列/話題別タブ */}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[390px] px-5 pb-6">
        <Link
          href={`/people/${person.id}/record`}
          className="block w-full rounded-btn bg-ink-primary py-4 text-center text-body font-bold text-neutral-card"
        >
          ＋ 記録する
        </Link>
      </div>
    </main>
  );
}
