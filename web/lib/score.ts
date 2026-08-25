/**
 * 盛り上がりスコア（引き継ぎ_実装指示書 §5）
 *
 * ★ 正は 資料/スコアの仕組み.py。値が食い違ったら Python が正しい。
 *   突き合わせは web/scripts/score-check.mts で行う。
 *
 * 計算方式を変えるときに触るのはこのファイルだけ（§10）。
 * topics.score / バブルの大きさ / 話題詳細のスコアは、すべてここに乗っている。
 */
import { differenceInCalendarDays } from "date-fns";

/**
 * ① EMA の係数。前回からの間隔が空くほど、今回の値を重く見る。
 * 来店ペースの違う業種に同じ式で対応するため（§5）
 */
const coef = (gapDays: number | null) =>
  gapDays === null ? 1.0 : gapDays <= 7 ? 0.2 : gapDays <= 30 ? 0.35 : 0.5;

/**
 * ② 時間減衰。最高値方式は「忘れない」ので、減衰が無いと
 * 1年前の当たりが永久に上位を占める。★ 時間減衰は削らない（§5）
 */
const decay = (days: number) =>
  days <= 90 ? 1.0 : days <= 180 ? 0.9 : days <= 365 ? 0.8 : 0.65;

/**
 * 日数の差。
 * ※ §5 の移植コードは Math.round((+to - +from) / 86_400_000) だが、
 *   talked_at（date 型）と new Date()（時刻あり）を混ぜると、夜間に
 *   1日ぶん多く数えて減衰の境界が早く来る。暦日で数えて回避する。
 */
const days = (from: Date, to: Date) => differenceInCalendarDays(to, from);

export type Rec = {
  keywordId: string | null;
  score: number;
  talkedAt: Date;
};

/** キーワードなしの記録をまとめる疑似枠。話題詳細のチップには出さない（§5・§7） */
export const NONE = "__none__";

/**
 * キーワード単位の EMA。
 * keyword_id が NULL の記録群は NONE の1枠にまとめる。
 * 含めないと「10秒で終わる記録」がバブルに反映されない（§7 決着1）
 */
export function keywordEmas(
  records: Rec[],
): Map<string, { ema: number; last: Date }> {
  const byKeyword = new Map<string, { ema: number; last: Date }>();
  for (const r of [...records].sort((a, b) => +a.talkedAt - +b.talkedAt)) {
    const key = r.keywordId ?? NONE;
    const prev = byKeyword.get(key);
    const c = coef(prev ? days(prev.last, r.talkedAt) : null);
    byKeyword.set(key, {
      ema: prev ? prev.ema * (1 - c) + r.score * c : r.score,
      last: r.talkedAt,
    });
  }
  return byKeyword;
}

/** 最高 × 0.7 ＋ 平均 × 0.3。滑ったのは振り方であって話題ではない（§5 ③） */
const aggregate = (vals: number[]) => {
  if (vals.length === 0) return null;
  const max = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return max * 0.7 + avg * 0.3;
};

/**
 * ある話題の records 全件から、今日時点の話題スコアを求める。
 *
 * ★ 減衰は「キーワードごと」に、そのキーワードの最終会話日からかける。
 *   話題に対して一律1回ではない。一律にすると topics.last_talked_at が
 *   直近の日付になり減衰率が 1.00 のままで、古い当たりが永久に残る
 *   （開発ログ 03 で計測：420日時点で 54.4 と 80.0 に割れた）
 */
export function topicScore(records: Rec[], today: Date): number | null {
  const vals = [...keywordEmas(records).values()].map(
    (v) => v.ema * decay(days(v.last, today)),
  );
  return aggregate(vals);
}

/**
 * topics.score に保存する値（減衰前の集約値）。
 * 表示のたびに records から計算し直すので、ここには減衰前を持つ（開発ログ 03）
 */
export function topicScoreUndecayed(records: Rec[]): number | null {
  const vals = [...keywordEmas(records).values()].map((v) => v.ema);
  return aggregate(vals);
}

/**
 * キーワードごとの表示値（EMA × 時間減衰）。
 * 話題詳細のチップの並びと濃淡に使う。
 * 減衰は「そのキーワードの最終会話日」からかける（話題に一律1回ではない）
 */
export function keywordDisplayValues(
  records: Rec[],
  today: Date,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [key, v] of keywordEmas(records)) {
    out.set(key, v.ema * decay(days(v.last, today)));
  }
  return out;
}
