/**
 * 話題ごとの色とアイコン（デザイン v2）
 *
 * 旧デザインは泡の色で「点数の4段階」を表していたが、v2 では話題そのものに
 * 色とアイコンを固定で割り当てる（資料/デザイン案_v2.png）。
 *
 * ★ 点数の情報は失われない。泡の大きさが点数を表していて、そちらは変えていない。
 *   色を点数から外したことで、同じ話題がいつ見ても同じ色・同じ絵になり、
 *   「この人は緑の泡（旅行）が大きい」と形で覚えられるようになる。
 *
 * ★ 色は話題マスタ10件に手で割り当てる。ハッシュで自動生成しない。
 *   自動だと「家族」と「仕事」が隣り合って同じ色になることがあり、
 *   泡が接したときに1つの塊に見えてしまう。
 *   利用者が独自に足した話題（topic_masters.user_id が自分のもの）だけ、
 *   名前のハッシュで4色から選ぶ。
 */

export type TopicColor = "coral" | "mustard" | "sage" | "gray";

export type TopicIconName =
  | "family"
  | "food"
  | "home"
  | "work"
  | "travel"
  | "health"
  | "hobby"
  | "entertainment"
  | "pet"
  | "sports"
  | "other";

/** 泡の地の色。文字は必ず ink-primary を載せる（コントラスト実測は globals.css 参照）*/
export const TOPIC_FILL: Record<TopicColor, string> = {
  coral: "var(--color-topic-coral)",
  mustard: "var(--color-topic-mustard)",
  sage: "var(--color-topic-sage)",
  gray: "var(--color-topic-gray)",
};

/** Tailwind のクラス側（HTML で使う場所用）*/
export const TOPIC_BG: Record<TopicColor, string> = {
  coral: "bg-topic-coral",
  mustard: "bg-topic-mustard",
  sage: "bg-topic-sage",
  gray: "bg-topic-gray",
};

/**
 * 初期話題マスタ10件（supabase/03_seed_master.sql）への割り当て。
 * 色は隣り合いやすい話題どうしが同じにならないように散らしてある。
 */
const PRESET: Record<string, { color: TopicColor; icon: TopicIconName }> = {
  家族: { color: "coral", icon: "family" },
  食べ物: { color: "mustard", icon: "food" },
  暮らし: { color: "sage", icon: "home" },
  仕事: { color: "coral", icon: "work" },
  "旅行・おでかけ": { color: "sage", icon: "travel" },
  "健康・美容": { color: "gray", icon: "health" },
  趣味: { color: "mustard", icon: "hobby" },
  エンタメ: { color: "gray", icon: "entertainment" },
  ペット: { color: "coral", icon: "pet" },
  スポーツ: { color: "sage", icon: "sports" },
};

const CYCLE: TopicColor[] = ["coral", "mustard", "sage", "gray"];

/**
 * 利用者が足した話題のための色。名前が同じなら必ず同じ色になるように、
 * 名前から決める（乱数や配列の位置で決めると、並べ替えるたびに色が変わる）。
 */
function hashColor(name: string): TopicColor {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CYCLE[h % CYCLE.length];
}

export function topicStyle(name: string): {
  color: TopicColor;
  icon: TopicIconName;
} {
  return PRESET[name] ?? { color: hashColor(name), icon: "other" };
}
