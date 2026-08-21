export default function Page() {
  return (
    <main className="p-6">
      <h1 className="text-title">おぼえがき</h1>
      <p className="text-body text-ink-secondary mt-2">
        会う直前の30秒で、前回の話を思い出す。
      </p>

      <button className="mt-4 rounded-btn bg-accent-500 px-5 py-3 text-neutral-card">
        ＋ 記録する
      </button>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-bubble-1 px-3 py-2 text-caption text-accent-ink">
          25
        </span>
        <span className="rounded-full bg-bubble-2 px-3 py-2 text-caption text-accent-ink">
          50
        </span>
        <span className="rounded-full bg-bubble-3 px-3 py-2 text-caption text-ink-primary">
          70
        </span>
        <span className="rounded-full bg-bubble-4 px-3 py-2 text-caption text-neutral-card">
          88
        </span>
        <span className="rounded-full bg-bubble-past px-3 py-2 text-caption text-ink-muted">
          前回
        </span>
      </div>

      <div className="mt-6 rounded-card border border-line-card bg-neutral-card p-4">
        <div className="text-label text-ink-secondary">プロフィール</div>
        <div className="text-name mt-1">田中 みか</div>
        <div className="text-sub text-ink-muted">前回 2026/02/03（3日前）</div>
      </div>

      <div className="mt-4 rounded-input border-l-4 border-danger-500 bg-danger-tint px-4 py-3">
        <span className="text-label text-danger-500">⚠ 避ける話題</span>
        <span className="text-name text-danger-500 ml-2">前職 / 結婚</span>
      </div>
    </main>
  );
}
