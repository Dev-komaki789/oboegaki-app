import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import { logout } from "./actions";

export const metadata: Metadata = { title: "設定｜おぼえがき" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 pb-16 pt-8">
      <header className="flex items-center gap-4 border-b border-line-form pb-5">
        <BackLink fallback="/people">戻る</BackLink>
        <h1 className="text-header text-ink-primary">設定</h1>
      </header>

      <dl className="mt-6 rounded-card border border-line-card bg-neutral-card p-4">
        <dt className="text-sub text-ink-secondary">ログイン中</dt>
        <dd className="mt-1 break-all text-body text-ink-primary">
          {user?.email}
        </dd>
      </dl>

      {/* ログアウトは押し間違えても復帰できる（ログインし直せばよい）ので1段階 */}
      <form action={logout} className="mt-6">
        <button
          type="submit"
          className="w-full rounded-btn border border-line-card bg-neutral-card py-4 text-body font-bold text-ink-primary"
        >
          ログアウト
        </button>
      </form>

      {/* TODO: プライバシーポリシーへのリンク（審査要件） */}
      {/* TODO: アカウント削除（審査要件）。auth.users を消す必要があるので
          SECURITY DEFINER の関数を用意してから */}
    </main>
  );
}
