"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <form action={formAction} className="mt-8">
      <label htmlFor="email" className="text-label text-ink-secondary">
        メールアドレス
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="mika.salon@example.com"
        className="mt-2 block w-full rounded-input border border-line-form bg-neutral-card px-4 py-4 text-body text-ink-primary placeholder:text-ink-placeholder focus:border-accent-500 focus:outline-none"
      />

      <label
        htmlFor="password"
        className="mt-5 block text-label text-ink-secondary"
      >
        パスワード
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mt-2 block w-full rounded-input border border-line-form bg-neutral-card px-4 py-4 text-body text-ink-primary focus:border-accent-500 focus:outline-none"
      />

      {state.error && (
        <p
          role="alert"
          className="mt-4 rounded-input border border-danger-border bg-danger-tint px-4 py-3 text-label text-danger-600"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-7 w-full rounded-btn bg-accent-500 py-4 text-body font-bold text-neutral-card disabled:opacity-60"
      >
        {pending ? "ログイン中…" : "ログイン"}
      </button>

      {/* TODO(Day5): パスワード再設定と新規登録。
          今日はアカウントを Supabase ダッシュボードから作る運用 */}
      <div className="mt-5 flex justify-between text-action text-accent-500">
        <span className="opacity-40">パスワードを忘れた方</span>
        <span className="opacity-40">新規登録</span>
      </div>
    </form>
  );
}
