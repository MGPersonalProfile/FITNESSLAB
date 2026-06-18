"use client";

import { useEffect, useState } from "react";
import { fetchAchievementStats, type AchievementStats } from "@/features/social/achievements";
import { t } from "@/shared/i18n";

type Item = { label: string; done: (s: AchievementStats) => boolean };

const ITEMS: Item[] = [
  { label: t.habit.steps.log, done: (s) => s.total_logs >= 1 },
  { label: t.habit.steps.plate, done: (s) => s.best_plate > 0 },
  { label: t.habit.steps.friend, done: (s) => s.friends >= 1 },
  { label: t.habit.steps.streak, done: (s) => s.streak >= 3 },
];

export default function HabitChecklist() {
  const [stats, setStats] = useState<AchievementStats | null>(null);

  useEffect(() => {
    let on = true;
    fetchAchievementStats().then((s) => on && setStats(s));
    return () => {
      on = false;
    };
  }, []);

  if (!stats) return null;
  const doneCount = ITEMS.filter((i) => i.done(stats)).length;
  // Hide once finished or once the user is clearly established.
  if (doneCount === ITEMS.length || stats.log_days >= 7) return null;

  return (
    <div className="border border-[var(--rule)]">
      <div className="flex items-baseline justify-between px-4 pt-3">
        <span className="mono-label">
          {t.habit.title}
        </span>
        <span className="font-mono text-[9px] tracking-[0.3em] text-[var(--accent)]">
          {doneCount}/{ITEMS.length}
        </span>
      </div>
      <div className="flex flex-col mt-2">
        {ITEMS.map((it) => {
          const done = it.done(stats);
          return (
            <div
              key={it.label}
              className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--rule)]"
            >
              <span className={done ? "text-[var(--success)]" : "text-[var(--fg-faint)]"}>
                {done ? "◆" : "◇"}
              </span>
              <span
                className={`font-mono text-[11px] tracking-[0.05em] ${
                  done ? "text-[var(--fg-faint)] line-through" : "text-[var(--fg-dim)]"
                }`}
              >
                {it.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
