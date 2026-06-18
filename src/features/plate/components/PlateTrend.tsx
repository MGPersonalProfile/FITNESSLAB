"use client";

import { useEffect, useState } from "react";
import { fetchPlateTrend, type PlateTrendPoint } from "@/features/plate/data";

function color(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--accent)";
}

export default function PlateTrend({ userId }: { userId: string }) {
  const [points, setPoints] = useState<PlateTrendPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    fetchPlateTrend(userId).then((p) => {
      if (on) {
        setPoints(p);
        setLoaded(true);
      }
    });
    return () => {
      on = false;
    };
  }, [userId]);

  if (!loaded || points.length < 2) return null;

  const avg = Math.round(points.reduce((s, p) => s + p.avg, 0) / points.length);
  const W = 300;
  const H = 48;
  const step = points.length > 1 ? W / (points.length - 1) : W;
  const coords = points.map((p, i) => ({
    x: i * step,
    y: H - (p.avg / 100) * H,
    score: p.avg,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <div className="mx-5 mb-6 border border-[var(--rule)] p-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">
          BALANCE // PLATO · {points.length}D
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em]" style={{ color: color(avg) }}>
          MEDIA {avg}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" height={H}>
        {/* target line at 80 (Balanceado) */}
        <line
          x1="0"
          x2={W}
          y1={H - (80 / 100) * H}
          y2={H - (80 / 100) * H}
          stroke="var(--rule)"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <path d={path} fill="none" stroke={color(avg)} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="2" fill={color(c.score)} />
        ))}
      </svg>
    </div>
  );
}
