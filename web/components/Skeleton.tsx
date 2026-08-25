/** 読み込み中に出す骨組み。押した瞬間に反応があることが目的で、
 *  中身の正確さは要らない（loading.tsx から使う） */
export function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-neutral-chip ${className}`} />;
}

export function Card({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-card bg-neutral-chip ${className}`} />
  );
}
