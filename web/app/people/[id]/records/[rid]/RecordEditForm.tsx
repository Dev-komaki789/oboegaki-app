"use client";

import { useActionState, useEffect, useState } from "react";
import { updateRecord, type RecordEditState } from "./actions";

const initial: RecordEditState = {};

export default function RecordEditForm({
  recordId,
  personId,
  topicId,
  initialScore,
  initialContent,
}: {
  recordId: string;
  personId: string;
  topicId: string;
  initialScore: number;
  initialContent: string;
}) {
  const [state, formAction, pending] = useActionState(updateRecord, initial);
  const [score, setScore] = useState(initialScore);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!state.error) return;
    document
      .querySelector("[data-error]")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  return (
    <form action={formAction} className="pb-40 lg:pb-0">
      <input type="hidden" name="id" value={recordId} />
      <input type="hidden" name="person_id" value={personId} />
      <input type="hidden" name="topic_id" value={topicId} />
      <input type="hidden" name="score" value={score} />

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-name text-ink-primary">盛り上がり</span>
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

        {/* 帯をタップすると値が飛ぶので、1点ずつ直せる手段も置く */}
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

      <section className="mt-8">
        <label htmlFor="content" className="text-name text-ink-primary">
          話した内容
        </label>
        <textarea
          id="content"
          name="content"
          rows={4}
          defaultValue={initialContent}
          className="mt-2 block w-full rounded-input border border-line-form bg-neutral-card px-4 py-3 text-body text-ink-primary focus:border-accent-500 focus:outline-none"
        />
        <p className="mt-2 text-sub text-ink-secondary">
          空にすると、話題別タブには出なくなります（時系列には残ります）。
        </p>
      </section>

      {state.error && (
        <p
          data-error
          role="alert"
          className="mt-6 rounded-input border border-danger-border bg-danger-tint px-4 py-3 text-label text-danger-600"
        >
          {state.error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[560px] bg-neutral-bg px-5 pb-6 pt-3 lg:static lg:mt-8 lg:px-0 lg:pb-0 lg:pt-0">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-btn bg-accent-500 py-4 text-body font-bold text-neutral-card disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存する"}
        </button>
      </div>
    </form>
  );
}
