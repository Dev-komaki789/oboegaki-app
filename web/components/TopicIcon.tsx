import type { TopicIconName } from "@/lib/topicStyle";

/**
 * 話題のアイコン（デザイン v2）
 *
 * すべて 24×24 の座標で、中心が (12,12)、線だけ（塗りなし）で描いてある。
 *
 * ★ 2つの使い方をする
 *   ① <TopicIcon>        … HTML の中（一覧・話題詳細）。<svg> ごと返す
 *   ② topicIconShapes()  … BubbleChart の <svg> の中。すでに svg の中なので
 *                          中身の <path> だけを返し、呼ぶ側が <g> で
 *                          位置と大きさを決める
 *
 * 線の太さは呼ぶ側が strokeWidth で渡す。泡の中では小さく描くので、
 * 24 の座標のまま縮めると線が細くなりすぎる（呼ぶ側で太さを補正している）。
 */
export function topicIconShapes(name: TopicIconName) {
  switch (name) {
    case "family":
      return (
        <>
          <circle cx="9" cy="8" r="3.3" />
          <path d="M2.8 19.6c0-3.4 2.8-5.5 6.2-5.5s6.2 2.1 6.2 5.5" />
          <circle cx="17.7" cy="9.9" r="2.4" />
          <path d="M16.7 14.5c2.9-.3 4.9 1.6 4.9 5.1" />
        </>
      );
    case "food":
      return (
        <>
          <path d="M8.8 9.6V21" />
          <path d="M6 3v4.2a2.8 2.8 0 0 0 5.6 0V3" />
          <path d="M8.8 3v4.2" />
          <path d="M16.6 21V3c2.9 1.7 3.9 5.1 3.9 8.3 0 2.4-1.4 3.7-3.9 3.7" />
        </>
      );
    case "home":
      return (
        <>
          <path d="M3.4 10.6 12 3.5l8.6 7.1v8.8a1.5 1.5 0 0 1-1.5 1.5H4.9a1.5 1.5 0 0 1-1.5-1.5z" />
          <path d="M9.4 20.9v-6.3h5.2v6.3" />
        </>
      );
    case "work":
      return (
        <>
          <path d="M4.2 20.8V4.7a1.1 1.1 0 0 1 1.1-1.1h8a1.1 1.1 0 0 1 1.1 1.1v16.1" />
          <path d="M14.4 10.3h4.9a1.1 1.1 0 0 1 1.1 1.1v9.4" />
          <path d="M7.3 7.6h3.9M7.3 11.6h3.9M7.3 15.6h3.9M16.8 14.4h1.4M16.8 17.9h1.4" />
          <path d="M2.6 20.9h18.8" />
        </>
      );
    case "travel":
      return (
        <>
          <rect x="3.4" y="6.9" width="17.2" height="11.4" rx="2.2" />
          <path d="M8.6 6.9V4.7a1.1 1.1 0 0 1 1.1-1.1h4.6a1.1 1.1 0 0 1 1.1 1.1v2.2" />
          <path d="M12 6.9v11.4" />
          <path d="M7.4 18.3v2M16.6 18.3v2" />
        </>
      );
    case "health":
      return (
        <path d="M12 20.5S3.5 15.2 3.5 9.3a4.8 4.8 0 0 1 8.5-3 4.8 4.8 0 0 1 8.5 3c0 5.9-8.5 11.2-8.5 11.2z" />
      );
    case "hobby":
      return (
        <>
          <path d="M12 3.3a8.7 8.7 0 1 0 0 17.4c1.3 0 2.1-.8 2.1-1.9 0-.5-.2-1-.6-1.3-.3-.3-.5-.7-.5-1.2 0-1 .8-1.9 1.9-1.9h1.5a4.4 4.4 0 0 0 4.3-4.4c0-3.8-3.9-6.7-8.7-6.7z" />
          <circle cx="7.9" cy="10.2" r="1.05" />
          <circle cx="11.8" cy="7.6" r="1.05" />
          <circle cx="15.9" cy="10" r="1.05" />
          <circle cx="7.7" cy="14.6" r="1.05" />
        </>
      );
    case "entertainment":
      return (
        <>
          <path d="M9.3 17.8V5.5l10.2-2v12" />
          <circle cx="6.7" cy="17.8" r="2.7" />
          <circle cx="16.8" cy="15.5" r="2.7" />
        </>
      );
    case "pet":
      return (
        <>
          <circle cx="6.5" cy="10.6" r="2" />
          <circle cx="10.5" cy="7.4" r="2.1" />
          <circle cx="14.8" cy="7.4" r="2.1" />
          <circle cx="18.4" cy="11" r="2" />
          <path d="M12.4 12.6c3 0 5.4 2.4 5.4 4.8 0 1.9-1.5 3.2-3.3 3.2-.9 0-1.5-.3-2.1-.3s-1.2.3-2.1.3c-1.8 0-3.3-1.3-3.3-3.2 0-2.4 2.4-4.8 5.4-4.8z" />
        </>
      );
    case "sports":
      return (
        <>
          <path d="M7.4 3.8h9.2v5.5a4.6 4.6 0 0 1-9.2 0z" />
          <path d="M7.4 5.4H5.2a2.1 2.1 0 0 0 0 4.2h2.2" />
          <path d="M16.6 5.4h2.2a2.1 2.1 0 0 1 0 4.2h-2.2" />
          <path d="M12 13.9v3.3" />
          <path d="M10 20.6v-1.5a2 2 0 0 1 4 0v1.5" />
          <path d="M8.6 20.6h6.8" />
        </>
      );
    // ── ここから下は、利用者が足した話題を名前から当てるために増やしたぶん
    //    （lib/topicStyle.ts の KEYWORDS）──────────────────
    case "car":
      return (
        <>
          <path d="M2.8 16.2v-3.4l2.1-4.4a1.8 1.8 0 0 1 1.6-1h11a1.8 1.8 0 0 1 1.6 1l2.1 4.4v3.4a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1z" />
          <path d="M4.9 12.8h14.2" />
          <circle cx="7.6" cy="17.2" r="1.7" />
          <circle cx="16.4" cy="17.2" r="1.7" />
        </>
      );
    case "drink":
      return (
        <>
          <path d="M4.4 7.4h12.2v7a4.6 4.6 0 0 1-4.6 4.6H9a4.6 4.6 0 0 1-4.6-4.6z" />
          <path d="M16.6 9.2h1.5a2.6 2.6 0 0 1 0 5.2h-1.5" />
          <path d="M3.4 21.2h14.2" />
        </>
      );
    case "shopping":
      return (
        <>
          <path d="M4.6 7.8h14.8l-1.2 12a1.4 1.4 0 0 1-1.4 1.3H7.2a1.4 1.4 0 0 1-1.4-1.3z" />
          <path d="M8.6 10.4V6.9a3.4 3.4 0 0 1 6.8 0v3.5" />
        </>
      );
    case "study":
      return (
        <>
          <path d="M12 6.6C10.2 5.2 7.6 4.6 4.2 4.8v12.4c3.4-.2 6 .4 7.8 1.8 1.8-1.4 4.4-2 7.8-1.8V4.8c-3.4-.2-6 .4-7.8 1.8z" />
          <path d="M12 6.6v12.4" />
        </>
      );
    case "game":
      return (
        <>
          <path d="M8.4 8.6h7.2a5.6 5.6 0 0 1 5.6 5.6v.5a3.3 3.3 0 0 1-6.1 1.8l-.5-.8H9.4l-.5.8a3.3 3.3 0 0 1-6.1-1.8v-.5a5.6 5.6 0 0 1 5.6-5.6z" />
          <path d="M6.4 11.8v2.5M5.2 13h2.5" />
          <circle cx="16.4" cy="12.4" r=".9" />
          <circle cx="18.1" cy="14.1" r=".9" />
        </>
      );
    case "money":
      return (
        <>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M8.8 8.2 12 12.1l3.2-3.9" />
          <path d="M12 12.1v4.4" />
          <path d="M9.2 13.3h5.6M9.2 15.1h5.6" />
        </>
      );

    default:
      // 利用者が自分で足した話題で、名前からも当たらなかったもの。吹き出し
      return (
        <path d="M20.5 12.2c0 4.1-3.8 7.4-8.5 7.4-1 0-2-.2-2.9-.5l-4.6 1.5 1.5-3.9a7 7 0 0 1-2.5-5.3c0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4z" />
      );
  }
}

export default function TopicIcon({
  name,
  className = "size-5",
  strokeWidth = 1.7,
}: {
  name: TopicIconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {topicIconShapes(name)}
    </svg>
  );
}
