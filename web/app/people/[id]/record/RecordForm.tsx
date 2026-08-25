"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveRecord, type RecordState } from "./actions";
import BackLink from "@/components/BackLink";

const initial: RecordState = {};

type Chip = { id: string; name: string };
type KeywordOption = { name: string; count: number };

export default function RecordForm({
  personId,
  personName,
  chips,
  keywordOptions,
}: {
  personId: string;
  personName: string;
  chips: Chip[];
  keywordOptions: KeywordOption[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveRecord, initial);

  const [topicId, setTopicId] = useState("");
  const [newTopic, setNewTopic] = useState(""); // 「＋新しい話題」を選んだとき
  const [topicQuery, setTopicQuery] = useState(""); // 入力欄は検索窓（§6）
  const [keyword, setKeyword] = useState("");
  const [score, setScore] = useState(50);
  const [contents, setContents] = useState<string[]>([""]);
  const [dragging, setDragging] = useState(false);
  const composing = useRef(false);

  // 「保存して、次を書く」で戻ってきたら入力を空にする
  useEffect(() => {
    if (!state.savedAt) return;
    setTopicId("");
    setNewTopic("");
    setTopicQuery("");
    setKeyword("");
    setScore(50);
    setContents([""]);
    router.refresh(); // チップの並び（話した回数順）を取り直す
  }, [state.savedAt, router]);

  const visibleChips = topicQuery
    ? chips.filter((c) => c.name.includes(topicQuery))
    : chips;

  // 入力した名前が既存に無ければ「＋新しい話題」を出す。判定はシステム側（§6）
  const isNewName =
    topicQuery.length > 0 && !chips.some((c) => c.name === topicQuery);

  const keywordSuggests = keyword
    ? keywordOptions
        .filter((k) => k.name.includes(keyword) && k.name !== keyword)
        .slice(0, 3)
    : [];
  const recentKeywords = keywordOptions.slice(0, 3);

  return (
    <form
      action={formAction}
      className="mx-auto w-full max-w-[430px] px-5 pb-40 pt-8"
    >
      <input type="hidden" name="person_id" value={personId} />
      <input type="hidden" name="topic_master_id" value={topicId} />
      <input
        type="hidden"
        name="new_topic_name"
        value={topicId ? "" : newTopic}
      />
      <input type="hidden" name="score" value={score} />

      <header className="flex items-center justify-between border-b border-line-form pb-5">
        <div className="flex items-center gap-4">
          <BackLink
            fallback={`/people/${personId}`}
            className="text-action text-accent-500"
          >
            閉じる
          </BackLink>
          <h1 className="text-header text-ink-primary">記録する</h1>
        </div>
        <span className="text-sub text-ink-secondary">{personName}</span>
      </header>

      {/* ── 話題（必須・単一選択）─────────────────── */}
      <section className="mt-6">
        <div className="flex items-center gap-2">
          <span className="text-name text-ink-primary">話題</span>
          <span className="rounded-badge bg-danger-500 px-2 py-0.5 text-caption font-bold text-neutral-card">
            必須
          </span>
        </div>

        {/* 入力欄は検索窓であり、選択の実体はチップ側にある（§6） */}
        <input
          value={
            topicId
              ? (chips.find((c) => c.id === topicId)?.name ?? "")
              : topicQuery
          }
          onChange={(e) => {
            setTopicQuery(e.target.value);
            setTopicId("");
            setNewTopic("");
          }}
          placeholder="食べ物"
          className="mt-2 block w-full rounded-input border border-line-form bg-neutral-card px-4 py-4 text-body text-ink-primary placeholder:text-ink-placeholder focus:border-accent-500 focus:outline-none"
        />
        <p className="mt-2 text-sub text-ink-secondary">
          よく使う順・1つだけ選べます
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {visibleChips.map((c) => {
            const on = topicId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setTopicId(on ? "" : c.id);
                  setNewTopic("");
                  setTopicQuery("");
                }}
                className={
                  "rounded-full border px-5 py-3 text-action " +
                  (on
                    ? "border-accent-500 bg-accent-500 text-neutral-card"
                    : "border-line-card bg-neutral-card text-ink-primary")
                }
              >
                {c.name}
              </button>
            );
          })}

          {/* 「新規登録ボタン」は置かない。既存に無ければこれが出る（§6） */}
          {isNewName && (
            <button
              type="button"
              onClick={() => {
                setNewTopic(topicQuery);
                setTopicId("");
              }}
              className={
                "rounded-full border border-dashed px-5 py-3 text-action " +
                (newTopic === topicQuery
                  ? "border-accent-500 bg-accent-tint text-accent-ink"
                  : "border-line-form text-ink-secondary")
              }
            >
              ＋{topicQuery}
            </button>
          )}
        </div>
      </section>

      {/* ── キーワード（任意）───────────────────── */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <span className="text-name text-ink-primary">キーワード</span>
          <span className="rounded-badge bg-neutral-chip px-2 py-0.5 text-caption text-ink-tertiary">
            任意
          </span>
          <span className="text-sub text-ink-secondary">
            ラーメン・沖縄などの具体
          </span>
        </div>

        <input
          name="keyword"
          value={keyword}
          onCompositionStart={() => (composing.current = true)}
          onCompositionEnd={() => (composing.current = false)}
          onChange={(e) => setKeyword(e.target.value)}
          className="mt-2 block w-full rounded-input border border-line-form bg-neutral-card px-4 py-4 text-body text-ink-primary focus:border-accent-500 focus:outline-none"
        />

        {keywordSuggests.map((k) => (
          <button
            key={k.name}
            type="button"
            onClick={() => setKeyword(k.name)}
            className="mt-2 flex w-full items-center justify-between rounded-input border border-line-card bg-neutral-card px-4 py-4 text-left"
          >
            <span className="text-body text-ink-primary">{k.name}</span>
            <span className="text-sub text-ink-muted">既存・{k.count}件</span>
          </button>
        ))}

        <div className="mt-3 flex flex-wrap gap-2">
          {recentKeywords.map((k) => (
            <button
              key={k.name}
              type="button"
              onClick={() => setKeyword(k.name)}
              className={
                "rounded-full border px-5 py-3 text-action " +
                (keyword === k.name
                  ? "border-accent-300 bg-accent-tint text-accent-ink"
                  : "border-line-card bg-neutral-card text-ink-primary")
              }
            >
              {k.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── 盛り上がり（必須・0〜100）───────────── */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-name text-ink-primary">盛り上がり</span>
            <span className="rounded-badge bg-danger-500 px-2 py-0.5 text-caption font-bold text-neutral-card">
              必須
            </span>
          </div>
          {/* ドラッグ中は拡大表示（M-06） */}
          <span
            className={
              "font-bold text-accent-500 transition-all " +
              (dragging ? "text-score" : "text-heading")
            }
          >
            {score}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onBlur={() => setDragging(false)}
          aria-label="盛り上がり"
          className="mt-4 h-11 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-runnable-track]:h-[18px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-neutral-chip
            [&::-webkit-slider-thumb]:mt-[-9px] [&::-webkit-slider-thumb]:size-9 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent-500 [&::-webkit-slider-thumb]:bg-neutral-card
            [&::-moz-range-track]:h-[18px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-neutral-chip
            [&::-moz-range-thumb]:size-9 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent-500 [&::-moz-range-thumb]:bg-neutral-card"
        />

        {/* 帯をタップすると値が飛ぶ（range の標準挙動で防げない）。
            1点ずつ直せる手段を並べておく。当たり判定は44px（M-06） */}
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setScore((v) => Math.max(0, v - 1))}
            className="size-11 rounded-full border border-line-card bg-neutral-card text-body text-ink-primary"
            aria-label="1つ下げる"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setScore((v) => Math.min(100, v + 1))}
            className="size-11 rounded-full border border-line-card bg-neutral-card text-body text-ink-primary"
            aria-label="1つ上げる"
          >
            ＋
          </button>
        </div>

        <div className="mt-1 flex justify-between text-sub text-ink-muted">
          <span>いまいち</span>
          <span>普通</span>
          <span>良い</span>
          <span>すごく</span>
        </div>
      </section>

      {/* ── 話した内容（任意）───────────────────── */}
      <section className="mt-8">
        <span className="text-name text-ink-primary">話した内容</span>
        <p className="mt-1 text-sub text-ink-secondary">
          同じ話で盛り上がっただけなら、書かなくて構いません
        </p>

        {contents.map((c, i) => (
          <textarea
            key={i}
            name="content"
            rows={3}
            value={c}
            onChange={(e) => {
              const next = [...contents];
              next[i] = e.target.value;
              setContents(next);
            }}
            className="mt-2 block w-full rounded-input border border-line-form bg-neutral-card px-4 py-3 text-body text-ink-primary focus:border-accent-500 focus:outline-none"
          />
        ))}

        {/* IME と Enter が競合するので「＋」ボタンを主役にする（M-01） */}
        <button
          type="button"
          onClick={() => setContents([...contents, ""])}
          className="mt-2 text-action text-accent-500"
        >
          ＋ もう1つ書く
        </button>
      </section>

      {/* ── NG（専用ページに隠さない）──────────── */}
      <label className="mt-8 flex items-center gap-3 rounded-input border border-danger-border bg-danger-tint px-4 py-4">
        <input
          type="checkbox"
          name="is_ng"
          className="size-5 accent-danger-500"
        />
        <span className="text-label text-danger-600">
          この話題は避けたほうがいい
        </span>
      </label>

      {state.error && (
        <p
          role="alert"
          className="mt-6 rounded-input border border-danger-border bg-danger-tint px-4 py-3 text-label text-danger-600"
        >
          {state.error}
        </p>
      )}

      {/* ── 保存（下部固定・M-04）──────────────── */}
      <div className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] gap-3 bg-neutral-bg px-5 pb-6 pt-3">
        <button
          type="submit"
          name="intent"
          value="next"
          disabled={pending}
          className="flex-1 rounded-btn border border-accent-500 py-4 text-action font-bold text-accent-500 disabled:opacity-60"
        >
          保存して、次を書く
        </button>
        <button
          type="submit"
          name="intent"
          value="close"
          disabled={pending}
          className="flex-1 rounded-btn bg-accent-500 py-4 text-action font-bold text-neutral-card disabled:opacity-60"
        >
          保存して閉じる
        </button>
      </div>
    </form>
  );
}
