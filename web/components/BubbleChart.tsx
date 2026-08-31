"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  forceCollide,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import { scaleSqrt } from "d3-scale";
import { topicStyle, TOPIC_FILL } from "@/lib/topicStyle";
import { topicIconShapes } from "./TopicIcon";

export type BubbleItem = {
  id: string;
  name: string;
  score: number;
  /** 直近にその話題で書いた内容。デザイン v2 で日付から差し替えた */
  latest: string | null;
};

type Node = SimulationNodeDatum &
  BubbleItem & {
    r: number;
    delay: number;
  };

const W = 350;
const HIT_R = 24; // 当たり判定の下限。指で押せる大きさ（§9 S-06）
const MIN_R = 12; // 見た目の下限。潰れて見えなくならないように
const CAP_R = 64; // 最大半径の上限

/** 泡が多いほど縦を伸ばす。8個や10個を 340px に詰めると必ず溢れる */
const heightFor = (n: number) => 300 + Math.min(n, 10) * 14;

/**
 * 泡の数に応じた最大半径。
 * 面積の合計がキャンバスの45%に収まるようにする。
 * 円は詰めても90%程度が限界で、力学的に配置するならもっと余裕が要る。
 * 上限 64 を固定にしていたため、8個だと合計面積が70%に達して枠から溢れていた。
 */
const maxRadiusFor = (n: number, h: number) =>
  Math.min(CAP_R, Math.sqrt((W * h * 0.45) / (Math.PI * Math.max(n, 1))));

/**
 * 色は話題ごとに固定（lib/topicStyle.ts）。デザイン v2 で点数の4段階から変えた。
 * 点数は泡の大きさが表しているので、色を話題に使っても情報は減らない。
 *
 * ★ 文字は必ず ink-primary。画像は白文字だが、この4色に白を載せると
 *   2.3:1 前後しか出ず、特に3行目の小さい説明文が読めない（globals.css 参照）
 */
const INK = "var(--color-ink-primary)";

/* ============================================================
   ふにょふにょの輪郭（デザイン v2）

   画像の泡は正円ではなく、少しゆがんだ有機的な形をしている。
   正円のままだと図表に見えるが、崩すと「話のかたまり」に見える。

   ★ 文字が読めなくなっては意味がないので、次の2つを守る
     ① 形は毎回同じ。話題の id から作る決まった値で崩すので、
        再描画（検索・戻る・タブ切り替え）のたびに形が変わることはない
     ② 文字の折り返しは、へこんだ側（r*(1-AMP)）を基準に計算する。
        平均の半径で計算すると、へこんだところで文字がはみ出す
   ============================================================ */

/** ゆがみの大きさ。0.085＝半径の±8.5%。これ以上崩すと円に見えなくなる */
const AMP = 0.085;
/** ふよふよ漂う幅（SVG の単位）。globals.css の bubble-float-* と揃えること */
const DRIFT = 3.2;
/** 変形で一番ふくらんだときの倍率。globals.css の bubble-wobble と揃えること */
const WOBBLE_MAX = 1.05;
/** 輪郭の制御点の数。少ないと角ばり、多いと正円に戻ってしまう */
const BLOB_POINTS = 7;

/** 文字を収める内側の半径。一番へこんだところ */
const innerR = (r: number) => r * (1 - AMP);

/** id から決まった値を作る。同じ泡なら毎回まったく同じ形になる */
function seedOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * 崩した輪郭を、なめらかな閉じた曲線として返す。
 *
 * 制御点をぐるりと置いて、Catmull-Rom を3次ベジェに変換してつなぐ。
 * 直線でつなぐと多角形になり、円弧でつなぐと継ぎ目が角になる。
 */
function blobPath(r: number, seed: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < BLOB_POINTS; i++) {
    const a = (i / BLOB_POINTS) * Math.PI * 2;
    // 種と番号から -1〜1 の決まった値を作る（乱数は使わない）
    const k = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const jitter = (k - Math.floor(k)) * 2 - 1;
    const rr = r * (1 + AMP * jitter);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }

  const at = (i: number) => pts[(i + BLOB_POINTS) % BLOB_POINTS];
  let d = `M${at(0)[0].toFixed(2)},${at(0)[1].toFixed(2)}`;
  for (let i = 0; i < BLOB_POINTS; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
  return d + "Z";
}

/**
 * 円の中で、中心から y だけ縦にずれた行に置ける文字数（全角換算）。
 * 円は上下に行くほど狭いので、行ごとに計算しないと文字が円からはみ出す。
 * 0.8 は左右の余白ぶん。
 */
function charsAt(r: number, y: number, fontSize: number) {
  const half = Math.sqrt(Math.max(0, r * r - y * y));
  return Math.floor((half * 2 * 0.8) / fontSize);
}

/**
 * 行頭に来てはいけない文字（行頭禁則）。
 * SVG の <text> は自分で切っているぶん、ブラウザの禁則処理が効かない。
 * 何もしないと「辛いものが好き／。スパイスカレー…」のように、
 * 句読点が次の行の先頭に落ちる。
 */
const NO_LINE_START =
  "。、．，）」』】〕〉》’”!?！？；：・…ー" +
  "ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ";

/**
 * 直近の話題を、円に収まる形で行に割る。
 * SVG の <text> は自動で折り返さないので、自分で切るしかない。
 * 入りきらなければ最後の行の末尾を「…」にする。
 */
function wrapInCircle(
  text: string,
  r: number,
  fontSize: number,
  ys: number[],
): string[] {
  const flat = text.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let i = 0;
  for (const y of ys) {
    if (i >= flat.length) break;
    let n = charsAt(r, y, fontSize);
    if (n < 4) break; // 3文字以下しか置けない行は、出しても読めない
    // 次の行の頭が禁則文字なら、この行の末尾にぶら下げる。
    // 幅の計算に2割の余裕を取ってあるので、1〜2文字なら輪郭を越えない
    let hang = 0;
    while (
      hang < 2 &&
      i + n < flat.length &&
      NO_LINE_START.includes(flat[i + n])
    ) {
      n++;
      hang++;
    }
    lines.push(flat.slice(i, i + n));
    i += n;
  }
  if (i < flat.length && lines.length > 0) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.slice(0, Math.max(1, last.length - 1)) + "…";
  }
  return lines;
}

export default function BubbleChart({
  personId,
  items,
}: {
  personId: string;
  items: BubbleItem[];
}) {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);

  const H = heightFor(items.length);
  const MAX_R = maxRadiusFor(items.length, H);

  useEffect(() => {
    if (items.length === 0) return;

    // ★ 必ず平方根スケール。半径を点数に比例させると面積が二乗で増え、
    //   100点が10点の100倍に見えてしまう（§9 S-06）
    const max = Math.max(...items.map((i) => i.score), 1);
    // ★ range の下限を 0 にする。§9 は range([24, maxRadius]) と書いているが、
    //   24 を「見た目の下限」にすると 0点でも直径48pxになり、泡の大きさが
    //   48〜128px の2.7倍幅に圧縮されて差が読めない。
    //   24 の根拠は「指で押せる下限」なので、当たり判定だけ 24 を確保し、
    //   見える円は面積が点数に正確に比例するようにする。
    const radius = scaleSqrt().domain([0, max]).range([0, MAX_R]);

    const data: Node[] = items.map((i, idx) => ({
      ...i,
      r: Math.max(MIN_R, radius(i.score)),
      // 登場を少しずつずらす。同時に出るより、順に現れる方が目を引く
      delay: idx * 0.045,

      // 初期位置を中心の近くに円周状に置く。
      // ★ 半径を 60 から 22 に縮めた。60 だと、最初の数ティックで
      //   泡どうしが深く重なった状態から collide が一気に外へ弾き、
      //   中央が空いたドーナツのまま alpha が尽きて止まっていた
      //   （旧デザインからの症状。泡の中が日付だけだったので目立たなかった）
      x: W / 2 + Math.cos((idx / items.length) * Math.PI * 2) * 22,
      y: H / 2 + Math.sin((idx / items.length) * Math.PI * 2) * 22,
    }));

    const sim = forceSimulation(data)
      // 中央に寄せる力。強くしすぎると collide と綱引きになり、
      // 泡どうしがめり込んだまま釣り合ってしまう。
      // ドーナツは初期位置（上）を詰めることで直したので、ここは弱いまま
      .force("x", forceX(W / 2).strength(0.055))
      .force("y", forceY(H / 2).strength(0.065))
      // ★ iterations を上げる。既定の1回では、泡が10個あると押し合いを
      //   解ききれずに重なったまま止まる。旧デザインは泡の中が
      //   「話題名＋日付」だけだったので重なりが目立たなかったが、
      //   v2 はアイコンと直近の話題まで入るため、重なると読めなくなる
      // ★ 半径は AMP ぶん膨らませ、さらに漂う幅ぶん足す。
      //   輪郭は最大 r*(1+AMP)*WOBBLE_MAX まで出っ張り、そのうえ泡ごと
      //   DRIFT だけ動くので、平均の r で当たりを取ると隣とぶつかる
      .force(
        "collide",
        forceCollide<Node>(
          (d) => d.r * (1 + AMP) * WOBBLE_MAX + DRIFT + 2,
        ).iterations(4),
      )
      // ★ 既定の alphaDecay（0.0228）では約300ティックで止まる。
      //   中央に寄せる力は alpha に比例して弱まるが collide は弱まらないので、
      //   最後まで走らせるほど重なりが解ける。逆に言うと、300 で打ち切ると
      //   めり込んだまま固まる。460ティックぶんに伸ばした。
      //   d3 の計算は座標だけなので、伸ばしても体感の重さは変わらない
      .alphaDecay(0.0145)
      // ★ d3 は座標計算だけ。描画は React の SVG で行う。
      //   d3 に DOM を触らせると React の再描画とぶつかる（§9 S-06）
      //
      // ★ tick ごとに setState していたのをやめ、収束させてから1回だけ描く
      //   ・毎ティック描くと、画面を開くたびに React を 470 回描き直していた
      //   ・落ち着くまでの過程は見せなくてよい。登場の動きは CSS の
      //     bubble-pop が受け持っている
      //   ・位置が確定してからでないと、下の viewBox（塊にぴったり合わせる）
      //     が毎ティック変わり、画面が伸び縮みして見える
      .stop();

    // alpha が alphaMin を下回るまでのティック数
    const total = Math.ceil(
      Math.log(sim.alphaMin()) / Math.log(1 - sim.alphaDecay()),
    );
    for (let t = 0; t < total; t++) {
      sim.tick();
      // 押し合った結果が枠を超えることがあるので、必ず内側に収める。
      // ★ ここも AMP ぶん膨らませる。平均の r で止めると、ふくらんだ側が
      //   SVG の外に出て、輪郭が真横にすっぱり切られる
      for (const n of data) {
        const R = n.r * (1 + AMP) * WOBBLE_MAX + DRIFT;
        n.x = Math.min(W - R, Math.max(R, n.x ?? W / 2));
        n.y = Math.min(H - R, Math.max(R, n.y ?? H / 2));
      }
    }
    setNodes(data);
  }, [items, H, MAX_R]);

  if (items.length === 0) return null;

  /* ★ 枠を、実際にできた塊にぴったり合わせる。
     0 0 W H のまま出すと、力学の結果しだいで塊が右下に寄り、左上に大きな
     余白が残る（実測で縦の38%が空いていた）。
     塊に合わせれば余白が消えるうえ、同じ画面幅に対して泡が大きく描かれる。
     ext は、変形で一番ふくらみ、かつ漂いで一番端に寄った瞬間でも、
     輪郭が枠の外に出ない大きさ。*/
  const PAD = 8;
  const ext = (n: Node) => n.r * (1 + AMP) * WOBBLE_MAX + DRIFT;
  const viewBox = nodes.length
    ? (() => {
        const minX = Math.min(...nodes.map((n) => (n.x ?? 0) - ext(n))) - PAD;
        const maxX = Math.max(...nodes.map((n) => (n.x ?? 0) + ext(n))) + PAD;
        const minY = Math.min(...nodes.map((n) => (n.y ?? 0) - ext(n))) - PAD;
        const maxY = Math.max(...nodes.map((n) => (n.y ?? 0) + ext(n))) + PAD;
        return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
      })()
    : `0 0 ${W} ${H}`;

  return (
    <svg
      viewBox={viewBox}
      className="mt-3 w-full"
      role="img"
      aria-label="話題の盛り上がり"
    >
      {/* ★ 小さい泡から先に描く。SVG は後に書いたものが上に重なるので、
          こうすると「アイコン＋話題＋直近の話題」を載せた大きい泡が
          必ず一番上に来る。少しでも重なると、下になった泡の文字は読めない */}
      {[...nodes]
        .sort((a, b) => a.r - b.r)
        .map((n) => {
          const style = topicStyle(n.name);

          /* 泡の大きさで、出せるものを段階的に増やす（§9 S-06 の情報量の調整）。
           小さい泡に3つ全部を詰めると、どれも読めない字になる。
             r>=38 … アイコン ＋ 話題 ＋ 直近の話題
             r>=26 … アイコン ＋ 話題
             r>=20 … 話題だけ
             それ未満 … 何も出さない（押すことはできる）

           ★ 最初 46/34 にしていたが、10個だと最大でも r=47 にしかならず、
             直近の話題が出る泡が1個しか無かった。実際の見え方を撮って詰めた値 */
          // ★ 文字の配置は、輪郭のへこんだ側（内接する円）で計算する。
          //   平均の半径で計算すると、へこんだところで文字が輪郭を越える
          const rt = innerR(n.r);

          const showIcon = rt >= 26;
          const showLatest = rt >= 38 && !!n.latest;

          const iconSize = Math.min(22, rt * (showLatest ? 0.4 : 0.46));
          // 3つ載せるときは上に寄せ、2つなら中心の少し上に置く
          const iconY = rt * (showLatest ? -0.44 : -0.26);

          // 話題名は、その高さで使える幅に収まるまで縮める。
          // 「旅行・おでかけ」のような長い名前が輪郭からはみ出すのを防ぐ
          const nameY = showLatest ? rt * 0.06 : showIcon ? rt * 0.26 : 4;
          const nameBase = Math.min(15, Math.max(9.5, rt / 3.6));
          const nameW =
            Math.sqrt(Math.max(0, rt * rt - nameY * nameY)) * 2 * 0.8;
          const nameSize = Math.max(
            9,
            Math.min(nameBase, nameW / Math.max(1, n.name.length)),
          );

          const subSize = Math.max(8, Math.min(10, rt / 6));
          const subYs = [rt * 0.34, rt * 0.34 + subSize * 1.15];
          const subLines = showLatest
            ? wrapInCircle(n.latest!, rt, subSize, subYs)
            : [];

          /* ふよふよの周期と位相を、泡ごとに散らす。
             全部同じにすると10個が揃って動き、画面が脈打って見える（§8）。
             種は話題の id なので、開き直しても同じ泡は同じ動き方をする。

               漂い … 2種類 × 9〜14秒
               変形 … 7〜11秒（漂いと周期が違うので、同じ組み合わせが戻らない）

             animationDelay を負にすると、その秒数ぶん「すでに進んだ」状態から
             始まる。0 から始めると、開いた瞬間に10個が同じ位置から動き出す */
          const seed = seedOf(n.id);
          const floatClass =
            seed % 2 === 0 ? "bubble-float-a" : "bubble-float-b";
          const floatDur = 9 + (seed % 6); // 9〜14秒
          const wobbleDur = 7 + ((seed >> 4) % 5); // 7〜11秒
          const floatPhase = -((seed >> 8) % 140) / 10; // 0〜-14秒
          const wobblePhase = -((seed >> 12) % 110) / 10; // 0〜-11秒

          return (
            <g
              key={n.id}
              transform={`translate(${n.x ?? 0},${n.y ?? 0})`}
              className="cursor-pointer"
              onClick={() => router.push(`/people/${personId}/topics/${n.id}`)}
            >
              {/* 位置・漂い・登場・押下で g を分ける。1つにまとめると
                transform が互いを上書きしてしまう。

                ★ 漂い（bubble-float）は泡ぜんぶにかける。平行移動なので、
                  文字と輪郭の位置関係は崩れず、読みやすさは変わらない。
                  形を変える bubble-wobble はもっと内側の、輪郭だけにかける */}
              <g
                className={floatClass}
                style={{
                  animationDuration: `${floatDur}s`,
                  animationDelay: `${floatPhase}s`,
                }}
              >
                <g
                  className="bubble-pop"
                  style={{ animationDelay: `${n.delay}s` }}
                >
                  <g className="bubble-press">
                    {/* 見える円が小さくても押せるようにする透明な当たり判定。
                fill="none" だとクリックを拾わないので transparent にする */}
                    <circle r={Math.max(n.r, HIT_R)} fill="transparent" />

                    {/* ★ ゆっくり形を変えるのは輪郭だけ。
                      アイコンと文字はこの g の外に置いてあるので、いっしょに
                      伸び縮みしない。文字まで動かすと、読もうとした瞬間に
                      ぶれて読めなくなる（「形は動くが文字は動かない」）*/}
                    <g
                      className="bubble-wobble"
                      style={{
                        animationDuration: `${wobbleDur}s`,
                        animationDelay: `${wobblePhase}s`,
                      }}
                    >
                      <path
                        d={blobPath(n.r, seed)}
                        fill={TOPIC_FILL[style.color]}
                      />
                    </g>

                    {showIcon && (
                      /* 24×24 で描いたアイコンを、泡の大きさに合わせて縮める。
                     線の太さは縮小の影響を打ち消してから渡す。
                     そのまま 1.7 にすると、小さい泡で線が消えてしまう */
                      <g
                        transform={`translate(${-iconSize / 2},${iconY - iconSize / 2}) scale(${iconSize / 24})`}
                        fill="none"
                        stroke={INK}
                        strokeWidth={
                          (24 / iconSize) * Math.max(1.1, iconSize / 15)
                        }
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {topicIconShapes(style.icon)}
                      </g>
                    )}

                    {n.r >= 20 && (
                      <text
                        textAnchor="middle"
                        y={nameY}
                        fill={INK}
                        style={{ fontSize: nameSize, fontWeight: 700 }}
                      >
                        {n.name}
                      </text>
                    )}

                    {subLines.map((line, i) => (
                      <text
                        key={i}
                        textAnchor="middle"
                        y={subYs[i]}
                        fill={INK}
                        style={{ fontSize: subSize }}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                </g>
              </g>
            </g>
          );
        })}
    </svg>
  );
}
