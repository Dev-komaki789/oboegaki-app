import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { RecordRow } from "@/lib/person";

/**
 * 情報タブの「時系列」（§9 S-04）。
 *
 * ModeTabs（Client Component）に JSX を prop で渡すと、配列が RSC の境界を
 * 越えるときにキーの検証が誤作動して警告が出る。配列をここで作れば起きない。
 */
export default function Timeline({
  personId,
  records,
  latestVisit,
}: {
  personId: string;
  records: RecordRow[];
  latestVisit: string | null;
}) {
  return (
    <ol className="mt-4">
      {records.map((r) => (
        <li key={r.id} className="flex gap-3">
          <div className="w-[76px] shrink-0 pt-1 text-right text-caption text-ink-muted">
            {format(parseISO(r.talked_at), "yyyy/MM/dd")}
          </div>
          <div className="relative flex w-3 shrink-0 justify-center">
            <span className="absolute top-2 size-2 rounded-full bg-accent-300" />
            <span className="w-px flex-1 bg-line-form" />
          </div>
          {/* カードごと修正画面への入口。内容が空の記録は話題別タブに
              出ないので、時系列からしか辿れない */}
          <Link
            href={`/people/${personId}/records/${r.id}`}
            className="mb-3 block flex-1 card-soft rounded-card border border-line-card bg-neutral-card p-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-label text-accent-500">{r.topicName}</span>
              {r.talked_at === latestVisit && (
                <span className="rounded-full bg-accent-500 px-2 py-0.5 text-caption text-neutral-card">
                  更新
                </span>
              )}
            </div>
            {r.content ? (
              <p className="mt-1 whitespace-pre-wrap text-body text-ink-primary">
                {r.content}
              </p>
            ) : (
              <p className="mt-1 text-sub text-ink-muted">（内容の記録なし）</p>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
