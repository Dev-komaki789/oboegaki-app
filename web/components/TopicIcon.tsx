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
    default:
      // 利用者が自分で足した話題。吹き出し
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
