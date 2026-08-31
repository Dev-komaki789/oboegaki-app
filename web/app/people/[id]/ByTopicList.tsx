import { format, parseISO } from "date-fns";
import type { RecordRow } from "@/lib/person";

export type TopicGroup = { name: string; rows: RecordRow[] };

/** 情報タブの「話題別」（§9 S-04）。content が空の記録は含めない */
export default function ByTopicList({
  groups,
  latestVisit,
}: {
  groups: TopicGroup[];
  latestVisit: string | null;
}) {
  return (
    <div className="mt-4 space-y-3">
      {groups.map((g) => (
        <div
          key={g.name}
          className="card-soft rounded-card border border-line-card bg-neutral-card p-4"
        >
          <div className="flex items-center gap-2 border-b border-line-faint pb-3">
            <span className="text-name text-accent-500">{g.name}</span>
            {g.rows.some((r) => r.talked_at === latestVisit) && (
              <span className="rounded-full bg-accent-500 px-2 py-0.5 text-caption text-neutral-card">
                更新
              </span>
            )}
          </div>
          {g.rows.map((r) => (
            <div
              key={r.id}
              className="flex items-baseline justify-between gap-3 border-b border-line-faint py-3 last:border-0 last:pb-0"
            >
              <span className="whitespace-pre-wrap text-body text-ink-primary">
                {r.content}
              </span>
              <span className="shrink-0 text-caption text-ink-muted">
                {format(parseISO(r.talked_at), "yyyy/MM/dd")}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
