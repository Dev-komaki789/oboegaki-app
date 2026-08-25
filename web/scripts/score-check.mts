/**
 * lib/score.ts が 資料/スコアの仕組み.py と同じ値を出すか突き合わせる。
 *
 *   cd web && node scripts/score-check.mts
 *
 * 期待値は `python3 資料/スコアの仕組み.py` の出力から取った。
 * 計算方式を変えたら、Python 側を先に直してからここを更新する（正は Python）。
 *
 * 許容誤差を 0.06 にしてあるのは、両者の「表示の丸め方」が違うため。
 * 生値が 39.25 のとき Python の f"{:.1f}" は偶数丸めで 39.2、
 * JS の toFixed(1) は五捨五入で 39.3 になる。計算結果は同じ。
 * （【2】の2番目が実際にこのケース。生値はどちらも 39.25）
 */
import { addDays } from "date-fns";
import { topicScore, type Rec } from "../lib/score.ts";

const BASE = new Date(2026, 0, 1); // 基準日。day N = BASE + N 日
const at = (n: number) => addDays(BASE, n);

type Event = [day: number, keyword: string, score: number];

/** Python の run() と同じく、1件ずつ足しながらその日時点のスコアを出す */
function trace(events: Event[]): number[] {
  const recs: Rec[] = [];
  const out: number[] = [];
  for (const [d, kw, v] of events) {
    recs.push({ keywordId: kw, score: v, talkedAt: at(d) });
    out.push(topicScore(recs, at(d))!);
  }
  return out;
}

const CASES: { title: string; events: Event[]; expect: number[] }[] = [
  {
    title: "【1】大谷は当たり、イチローは滑る",
    events: [[0,"大谷翔平",90],[60,"イチロー",40],[120,"大谷翔平",90],[180,"イチロー",40],[240,"大谷翔平",88]],
    expect: [90.0, 82.5, 82.5, 82.5, 81.6],
  },
  {
    title: "【2】何を振っても滑る",
    events: [[0,"大谷翔平",40],[60,"イチロー",35],[120,"甲子園",45],[180,"大谷翔平",30]],
    expect: [40.0, 39.2, 43.1, 42.6],
  },
  {
    title: "【3】旬が過ぎる",
    events: [[0,"大谷翔平",90],[60,"大谷翔平",85],[120,"大谷翔平",40],[180,"大谷翔平",35]],
    expect: [90.0, 87.5, 63.8, 49.4],
  },
  {
    title: "【4】当たりを出したきり放置",
    events: [[0,"大谷翔平",90],[60,"イチロー",40],[180,"イチロー",35],[300,"甲子園",42],[420,"イチロー",38]],
    expect: [90.0, 82.5, 74.5, 65.2, 54.4],
  },
  {
    title: "【5】常連・週1来店",
    events: [[0,"大谷翔平",80],[7,"大谷翔平",85],[14,"大谷翔平",75],[21,"大谷翔平",90],[28,"大谷翔平",70]],
    expect: [80.0, 81.0, 79.8, 81.8, 79.5],
  },
  {
    title: "【6】タグが5個に増える",
    events: [[0,"大谷翔平",90],[60,"イチロー",40],[120,"甲子園",50],[180,"阪神",85],[240,"WBC",45]],
    expect: [90.0, 82.5, 73.8, 78.4, 76.5],
  },
];

let failed = 0;

for (const c of CASES) {
  const got = trace(c.events);
  const ok = got.every((g, i) => Math.abs(g - c.expect[i]) < 0.06);
  if (!ok) failed++;
  console.log(`${ok ? "  OK " : "★NG "} ${c.title}`);
  console.log(
    `       got    ${got.map((v) => v.toFixed(1).padStart(5)).join(" ")}`,
  );
  console.log(
    `       expect ${c.expect.map((v) => v.toFixed(1).padStart(5)).join(" ")}`,
  );
}

// ── 【7】バブル順位の推移（1人の顧客・2年分）──────────────
const seq = (start: number, stop: number, step: number) => {
  const a: number[] = [];
  for (let v = start; v <= stop; v += step) a.push(v);
  return a;
};
const zip = (ds: number[], vs: number[], kw: string): Event[] =>
  vs.map((v, i) => [ds[i], kw, v] as Event);

const TOPICS: Record<string, Event[]> = {
  天気: zip(seq(0,720,60), [35,40,30,38,35,40,32,36,34,38,30,35,37], "天気"),
  家族: zip(seq(0,720,60), [60,65,55,70,60,65,62,68,60,64,66,60,63], "お子さん"),
  スポーツ: [[0,"大谷翔平",90],[120,"大谷翔平",88],[240,"阪神",85],[360,"大谷翔平",92],[480,"大谷翔平",90],[600,"阪神",86],[720,"大谷翔平",89]],
  旅行: [[60,"沖縄",75],[180,"沖縄",80],[300,"京都",70],[540,"沖縄",78]],
  ペット: [[120,"ミケ",82],[240,"ミケ",85],[420,"ミケ",80],[660,"ミケ",84]],
  仕事: [[0,"転職",50],[120,"転職",45],[240,"転職",55],[480,"転職",48]],
  食: [[180,"カレー",68],[360,"カレー",72],[600,"ラーメン",65]],
  暮らし: [[60,"引っ越し",55],[300,"通勤",52],[540,"引っ越し",58]],
  車: [[240,"買い替え",45],[600,"買い替え",47]],
  地元: [[360,"実家",58]],
};

const EXPECT_7: Record<number, string> = {
  180: "スポーツ89 / ペット83 / 旅行77 / 食69 / 家族63 / 地元58",
  360: "スポーツ89 / ペット83 / 旅行77 / 食69 / 家族63 / 地元58",
  540: "スポーツ89 / ペット83 / 旅行74 / 食65 / 家族63 / 暮らし54",
  720: "スポーツ88 / ペット83 / 旅行66 / 家族63 / 食58 / 暮らし48",
};

console.log("\n【7】バブル順位の推移");
for (const today of [180, 360, 540, 720]) {
  const ranked = Object.entries(TOPICS)
    .map(([name, evs]) => {
      const recs: Rec[] = evs.map(([d, kw, v]) => ({
        keywordId: kw, score: v, talkedAt: at(d),
      }));
      return [name, topicScore(recs, at(today))] as const;
    })
    .filter((r): r is readonly [string, number] => r[1] !== null)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([n, s]) => `${n}${s.toFixed(0)}`)
    .join(" / ");
  const ok = ranked === EXPECT_7[today];
  if (!ok) failed++;
  console.log(`${ok ? "  OK " : "★NG "} ${String(today / 30).padStart(2)}ヶ月時点: ${ranked}`);
  if (!ok) console.log(`       expect      ${EXPECT_7[today]}`);
}

console.log(
  failed === 0
    ? "\n✅ 全ケース一致。lib/score.ts は スコアの仕組み.py と同じ値を出している"
    : `\n★ ${failed} 件が不一致`,
);
process.exit(failed === 0 ? 0 : 1);
