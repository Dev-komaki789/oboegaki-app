"use client";

import { useActionState } from "react";
import { createPerson, type PersonState } from "./actions";

const initial: PersonState = {};

const AGE_GROUPS = ["10代", "20代", "30代", "40代", "50代", "60代", "70代以上"];
const GENDERS = ["女性", "男性", "その他"];

const field =
  "mt-2 block w-full rounded-input border border-line-form bg-neutral-card px-4 py-4 text-body text-ink-primary placeholder:text-ink-placeholder focus:border-accent-500 focus:outline-none";

export default function PersonForm({ companies }: { companies: string[] }) {
  const [state, formAction, pending] = useActionState(createPerson, initial);

  return (
    <form action={formAction} className="pb-28">
      {/* ── 必須 ───────────────────────────── */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <label htmlFor="name" className="text-name text-ink-primary">
            名前
          </label>
          <span className="rounded-badge bg-danger-500 px-2 py-0.5 text-caption font-bold text-neutral-card">
            必須
          </span>
        </div>
        <input
          id="name"
          name="name"
          required
          placeholder="田中 みか"
          className={field}
        />
        <p className="mt-2 text-sub text-ink-secondary">
          入力が必要なのはここだけです。
        </p>
      </div>

      {/* ── 区切り ─────────────────────────── */}
      <div className="mt-8 flex items-center gap-3">
        <span className="shrink-0 text-sub text-ink-muted">
          ここから下はすべて任意
        </span>
        <span className="h-px flex-1 bg-line-form" />
      </div>
      <p className="mt-3 text-sub text-ink-secondary">
        あとから足せます。同姓同名のお客さんを見分けたいときに役立ちます。
      </p>

      {/* ── よみがな ───────────────────────── */}
      <div className="mt-6">
        <label htmlFor="name_kana" className="text-name text-ink-primary">
          よみがな
        </label>
        <input
          id="name_kana"
          name="name_kana"
          placeholder="たなか みか"
          className={field}
        />
      </div>

      {/* ── 年代・性別 ─────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="age_group" className="text-name text-ink-primary">
            年代
          </label>
          <select
            id="age_group"
            name="age_group"
            defaultValue=""
            className={field}
          >
            <option value="">未選択</option>
            {AGE_GROUPS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gender" className="text-name text-ink-primary">
            性別
          </label>
          <select id="gender" name="gender" defaultValue="" className={field}>
            <option value="">未選択</option>
            {GENDERS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 見た目の特徴 ───────────────────── */}
      <div className="mt-6">
        <label htmlFor="appearance" className="text-name text-ink-primary">
          見た目の特徴
        </label>
        <input
          id="appearance"
          name="appearance"
          placeholder="ショートボブ、眼鏡"
          className={field}
        />
        <p className="mt-2 text-sub text-ink-secondary">
          「、」で区切ると、一覧では1つずつのタグに分かれて表示されます。
        </p>
        <p className="mt-1 text-sub text-ink-muted">
          例）ショートボブ、眼鏡 → ショートボブ・眼鏡
        </p>
      </div>

      {/* ── 会社名・役職 ───────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="company" className="text-name text-ink-primary">
            会社名
          </label>
          {/* list= でブラウザ標準の補完が出る。JavaScript は不要 */}
          <input
            id="company"
            name="company"
            list="company-options"
            className={field}
          />
          <datalist id="company-options">
            {companies.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="position" className="text-name text-ink-primary">
            役職
          </label>
          <input id="position" name="position" className={field} />
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="mt-6 rounded-input border border-danger-border bg-danger-tint px-4 py-3 text-label text-danger-600"
        >
          {state.error}
        </p>
      )}

      {/* ── 保存ボタン（下部固定）───────────── */}
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[390px] bg-neutral-bg px-5 pb-6 pt-3">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-btn bg-accent-500 py-4 text-body font-bold text-neutral-card disabled:opacity-60"
        >
          {pending ? "登録中…" : "登録する"}
        </button>
      </div>
    </form>
  );
}
