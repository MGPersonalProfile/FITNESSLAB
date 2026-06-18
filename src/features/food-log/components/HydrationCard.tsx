"use client";

import { useEffect, useState } from "react";
import { addWater, fetchWaterToday } from "@/features/food-log/data";
import { track } from "@/shared/lib/analytics";
import { HYDRATION } from "@/shared/config";
import { t } from "@/shared/i18n";

const GOAL_ML = HYDRATION.goalMl;
const STEPS = HYDRATION.stepsMl;

export default function HydrationCard({ userId }: { userId: string }) {
  const [ml, setMl] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let on = true;
    fetchWaterToday(userId).then((v) => on && setMl(v));
    return () => {
      on = false;
    };
  }, [userId]);

  const add = async (delta: number) => {
    if (busy) return;
    setBusy(true);
    setMl((m) => m + delta); // optimistic
    try {
      await addWater(userId, delta);
      track("water_added", { ml: delta });
    } catch {
      setMl((m) => m - delta);
    } finally {
      setBusy(false);
    }
  };

  const pct = Math.min(100, Math.round((ml / GOAL_ML) * 100));

  return (
    <div className="border border-[var(--rule)] p-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="mono-label">
          {t.hydration.title}
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--fg-dim)]">
          {(ml / 1000).toFixed(2)}
          <span className="text-[var(--fg-faint)]"> / {(GOAL_ML / 1000).toFixed(1)} L</span>
        </span>
      </div>
      <div className="relative w-full h-2 bg-[var(--bg-elev)] border border-[var(--rule)] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {STEPS.map((s) => (
          <button
            key={s}
            onClick={() => add(s)}
            disabled={busy}
            className="border border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--fg-dim)] font-mono text-[10px] tracking-[0.2em] py-2.5 transition-colors active:scale-[0.99] disabled:opacity-50"
          >
            + {s} ml
          </button>
        ))}
      </div>
    </div>
  );
}
