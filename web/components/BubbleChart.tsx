"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  forceCollide,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import { scaleSqrt } from "d3-scale";

export type BubbleItem = {
  id: string;
  name: string;
  score: number;
  lastLabel: string | null;
  past: boolean;
};

type Node = SimulationNodeDatum & BubbleItem & {
  r: number;
  dur: number;
  delay: number;
};

const W = 350;
const H = 340;
const HIT_R = 24; // 当たり判定の下限。指で押せる大きさ（§9 S-06）
const MIN_R = 12; // 見た目の下限。潰れて見えなくならないように
const MAX_R = 64;

/**
 * 色は表示値の4段階。文字色はコントラスト実測（開発ログ 05）に従う。
 *
 * ★ 「前回話した」も塗りは点数どおりにする。
 *   §9 は bubble-past（薄いグレー）で塗りつぶし「目立たせない」設計だったが、
 *   それだと前回話した話題が何点だったか読めなくなる。
 *   目印は枠に持たせ、塗りは点数の情報を保つ。
 */
function fill(item: BubbleItem) {
  if (item.score < 40)
    return { bg: "var(--color-bubble-1)", fg: "var(--color-accent-ink)" };
  if (item.score < 60)
    return { bg: "var(--color-bubble-2)", fg: "var(--color-accent-ink)" };
  if (item.score < 80)
    return { bg: "var(--color-bubble-3)", fg: "var(--color-ink-primary)" };
  return { bg: "var(--color-bubble-4)", fg: "var(--color-neutral-card)" };
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
  const started = useRef(false);

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
      // 泡ごとに周期と開始位置をずらす。揃うと機械的に見える
      dur: 4 + (idx % 5) * 0.5,
      delay: -(idx % 7) * 0.7,

      // 初期位置を円周上にばらしておくと、まとまるまでが速い
      x: W / 2 + Math.cos((idx / items.length) * Math.PI * 2) * 60,
      y: H / 2 + Math.sin((idx / items.length) * Math.PI * 2) * 60,
    }));

    const sim = forceSimulation(data)
      .force("x", forceX(W / 2).strength(0.045))
      .force("y", forceY(H / 2).strength(0.055))
      .force(
        "collide",
        forceCollide<Node>((d) => d.r + 2),
      )
      // ★ d3 は座標計算だけ。描画は React の SVG で行う。
      //   d3 に DOM を触らせると React の再描画とぶつかる（§9 S-06）
      .on("tick", () => setNodes([...data]));

    started.current = true;
    return () => {
      sim.stop();
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 w-full"
      role="img"
      aria-label="話題の盛り上がり"
    >
      {nodes.map((n) => {
        const c = fill(n);
        // 前回話した泡は、日付ではなく「前回話した」と書く。
        // 凡例を読まなくても意味が分かるようにするため
        const sub = n.past ? "前回話した" : n.lastLabel;
        const showSub = n.r >= 34 && !!sub;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x ?? 0},${n.y ?? 0})`}
            className="cursor-pointer"
            onClick={() => router.push(`/people/${personId}/topics/${n.id}`)}
          >
            {/* 見える円が小さくても押せるようにする透明な当たり判定。
                fill="none" だとクリックを拾わないので transparent にする。
                これは揺らさない（押す位置が動くと取りこぼす） */}
            <circle r={Math.max(n.r, HIT_R)} fill="transparent" />
            <circle
              r={n.r}
              fill={c.bg}
              // 前回話した話題は枠で示す。色を変えると点数が読めなくなる。
              // ink-primary なのは、4段階の緑すべてと背景の両方で差が出る
              // 唯一の色だから（最小コントラスト 2.92）。
              // 青や accent-500 は緑と明度が近く、bubble-3 の上でほぼ消える（1.03）
              stroke={n.past ? "var(--color-ink-primary)" : "none"}
              strokeWidth={n.past ? 3 : 0}
              className="bubble-float"
              style={{
                animationDuration: `${n.dur}s`,
                animationDelay: `${n.delay}s`,
              }}
            />
            {n.r >= 20 && (
              <text
                textAnchor="middle"
                y={showSub ? -2 : 4}
                fill={c.fg}
                style={{ fontSize: Math.min(13, Math.max(9, n.r / 4.2)) }}
              >
                {n.name}
              </text>
            )}

            {showSub && (
              <text
                textAnchor="middle"
                y={12}
                fill={c.fg}
                opacity={n.past ? 1 : 0.75}
                style={{ fontSize: 9, fontWeight: n.past ? 700 : 400 }}
              >
                {sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
