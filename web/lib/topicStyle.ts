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
  // ↓ 利用者が自分で足した話題を受けるために増やしたぶん
  | "car"
  | "drink"
  | "shopping"
  | "study"
  | "game"
  | "money"
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

/**
 * 利用者が自分で足した話題に、名前からアイコンを当てる表。
 *
 * ★ なぜ「選ばせる」ではなく「推測」なのか
 *   新しい話題は記録画面（S-08）で名前を打つだけで作られる。
 *   ここはお客さんに会う直前の30秒で使う画面なので、
 *   アイコンを選ぶ一手間を足すと、その30秒が崩れる。
 *   名前から当てれば、利用者は何も増えないまま絵が付く。
 *
 * ★ 外れても実害は無い。当たらなければ下の「other」（吹き出し）になるだけで、
 *   話題名は泡の中に必ず出ている。だから精度より「手間ゼロ」を優先する。
 *
 * ★ 上から順に見て最初に当たったものを使う。
 *   狭い言葉ほど上に置くこと（「ペット」より「犬」が下だと犬が拾えない、
 *   ということは無いが、「音楽」と「楽器」のように片方が片方を含む場合に効く）。
 */
const KEYWORDS: [RegExp, TopicIconName][] = [
  [/犬|猫|ねこ|イヌ|ネコ|ペット|うさぎ|ハムスター|インコ|金魚|散歩/, "pet"],
  [/車|クルマ|ドライブ|バイク|運転|免許|電車|新幹線/, "car"],
  [
    /酒|ビール|ワイン|焼酎|日本酒|飲み会|カフェ|コーヒー|珈琲|お茶|紅茶/,
    "drink",
  ],
  [/買い物|ショッピング|服|ファッション|靴|バッグ|コスメ|ネイル/, "shopping"],
  [/勉強|学校|大学|受験|資格|試験|英語|語学|習い事|塾/, "study"],
  [/ゲーム|switch|プレステ|スマホゲー/i, "game"],
  [/お金|貯金|投資|株|節約|保険|ローン|年金|ふるさと納税/, "money"],
  [
    /子ども|子供|娘|息子|孫|妻|夫|旦那|嫁|親|両親|兄弟|姉妹|家族|実家/,
    "family",
  ],
  [
    /食|グルメ|ラーメン|寿司|焼肉|カレー|料理|スイーツ|お菓子|パン|弁当|野菜/,
    "food",
  ],
  [/家|住まい|インテリア|雑貨|引っ越し|掃除|洗濯|DIY|庭|家電|暮らし/, "home"],
  [/仕事|職場|会社|転職|出張|営業|上司|同僚|キャリア|残業|副業/, "work"],
  [/旅|旅行|おでかけ|温泉|キャンプ|海外|観光|帰省|ドライブ旅/, "travel"],
  [
    /健康|美容|ダイエット|ヨガ|筋トレ|ジム|肌|髪|病院|睡眠|花粉|サプリ/,
    "health",
  ],
  [
    /スポーツ|野球|サッカー|ゴルフ|テニス|バスケ|マラソン|登山|スキー|釣り|観戦/,
    "sports",
  ],
  [
    /映画|ドラマ|音楽|ライブ|アニメ|漫画|マンガ|本|読書|テレビ|推し|アイドル|K-?POP/i,
    "entertainment",
  ],
  [
    /趣味|写真|カメラ|絵|イラスト|手芸|編み物|園芸|ガーデニング|楽器|将棋|囲碁/,
    "hobby",
  ],
];

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
  // ① 初期話題マスタの10件は、手で決めた組み合わせをそのまま使う
  const preset = PRESET[name];
  if (preset) return preset;

  // ② 利用者が足した話題は、名前から絵を当てる
  const color = hashColor(name);
  for (const [re, icon] of KEYWORDS) {
    if (re.test(name)) return { color, icon };
  }

  // ③ どれにも当たらなければ吹き出し。話題名は泡の中に出ているので困らない
  return { color, icon: "other" };
}
