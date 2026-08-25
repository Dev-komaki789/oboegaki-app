import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "ログイン｜おぼえがき" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6">
      {/* ロゴ：accent-500 地に白の「記」・角丸14（§9 S-01） */}
      <div className="flex size-[72px] items-center justify-center rounded-btn bg-accent-500">
        <span className="text-heading text-neutral-card">記</span>
      </div>

      <h1 className="mt-5 text-title">おぼえがき</h1>
      <p className="mt-2 text-body text-ink-secondary">
        会う直前の30秒で、前回の話を思い出す。
      </p>

      <LoginForm />
    </main>
  );
}
