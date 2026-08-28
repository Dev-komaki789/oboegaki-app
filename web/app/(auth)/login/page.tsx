import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "ログイン｜おぼえがき" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      {/* スマホは背景に直接、タブレットは白いカードに載せる（T-01）*/}
      <div className="w-full max-w-[430px] lg:max-w-[520px] lg:rounded-card lg:bg-neutral-card lg:px-16 lg:py-20 lg:shadow-[0_1px_2px_rgba(44,44,44,.05),0_8px_24px_-16px_rgba(44,44,44,.18)]">
        {/* ロゴ：accent-500 地に白の「記」・角丸14（§9 S-01） */}
        <div className="flex size-[72px] items-center justify-center rounded-btn bg-accent-500">
          <span className="text-heading text-neutral-card">記</span>
        </div>

        <h1 className="mt-5 text-title">おぼえがき</h1>
        <p className="mt-2 text-body text-ink-secondary">
          会う直前の30秒で、前回の話を思い出す。
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
