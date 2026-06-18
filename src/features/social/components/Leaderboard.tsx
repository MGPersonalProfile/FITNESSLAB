"use client";

import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardRow } from "@/features/social/data";

function plateColor(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--accent)";
}

export default function Leaderboard({ userId }: { userId: string }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    fetchLeaderboard().then((r) => {
      if (on) {
        setRows(r);
        setLoaded(true);
      }
    });
    return () => {
      on = false;
    };
  }, []);

  // Only worth showing once there's a circle (you + at least one friend).
  if (!loaded || rows.length < 2) return null;

  return (
    <section className="px-5 mt-8">
      <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">
        RANKING // 7D
      </div>
      <div className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-x-3 font-mono text-[8px] tracking-[0.25em] text-[var(--fg-faint)] px-1 pb-1">
        <span>#</span>
        <span>OPERADOR</span>
        <span className="text-right">RACHA</span>
        <span className="text-right">PLATO</span>
      </div>
      <div className="flex flex-col">
        {rows.map((r, i) => {
          const me = r.user_id === userId;
          return (
            <div
              key={r.user_id}
              className={`grid grid-cols-[24px_1fr_auto_auto] items-center gap-x-3 border-t border-[var(--rule)] last:border-b py-2.5 ${
                me ? "bg-[var(--bg-elev)]" : ""
              }`}
            >
              <span className="font-mono text-[11px] text-[var(--fg-faint)]">{i + 1}</span>
              <span className={`font-mono text-[12px] truncate ${me ? "text-[var(--accent)]" : "text-[var(--fg)]"}`}>
                {r.display_name ?? "Anónimo"}
                {me && <span className="text-[var(--fg-faint)] text-[9px] tracking-[0.2em]"> · TÚ</span>}
              </span>
              <span className="font-mono text-[12px] text-[var(--fg-dim)] text-right">
                {r.streak}
                <span className="text-[var(--fg-faint)] text-[9px]">d</span>
              </span>
              <span
                className="font-mono text-[12px] text-right"
                style={{ color: r.avg_plate > 0 ? plateColor(r.avg_plate) : "var(--fg-faint)" }}
              >
                {r.avg_plate > 0 ? r.avg_plate : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
