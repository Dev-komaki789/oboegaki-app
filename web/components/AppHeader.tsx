/**
 * 画面上部の帯（デザイン v2）
 *
 * 資料/デザイン案_v2.png の一番の目印が、中央に置かれたコーラルのロゴ。
 * これを全画面の同じ位置に出すことで、11本の画面が1つのアプリに見える。
 *
 * ★ ロゴは absolute で真ん中に固定する。
 *   左右のスロット（戻る／編集）は文字数がばらばらなので、
 *   flex の中央寄せにするとロゴの位置が画面ごとに数十pxずれる。
 *
 * ★ ロゴの色は accent-500（#b04e33）。画像の明るいコーラル #ea967e は
 *   クリーム地の上で 2.11:1 しか出ず、大きな文字の下限 3:1 にも届かない。
 *   同じ色相のまま暗くして 4.85:1 にしてある。
 */
export default function AppHeader({
  left,
  right,
  className = "",
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`relative flex h-8 items-center justify-between ${className}`}
    >
      <div className="min-w-0 flex-1">{left}</div>

      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-maru text-header tracking-[0.08em] text-accent-500">
        おぼえがき
      </span>

      <div className="flex min-w-0 flex-1 justify-end">{right}</div>
    </header>
  );
}
