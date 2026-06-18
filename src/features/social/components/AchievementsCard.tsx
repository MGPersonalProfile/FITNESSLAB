"use client";

import { useEffect, useState } from "react";
import { track } from "@/shared/lib/analytics";
import {
  BADGES,
  fetchAchievementStats,
  fetchEarnedKeys,
  syncAchievements,
} from "@/features/social/achievements";

export default function AchievementsCard({ userId }: { userId: string }) {
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    Promise.all([fetchAchievementStats(), fetchEarnedKeys(userId)]).then(async ([stats, prior]) => {
      const fresh = await syncAchievements(userId, stats, prior);
      if (fresh.length) fresh.forEach((key) => track("achievement_earned", { key }));
      if (on) {
        setEarned(new Set([...prior, ...fresh]));
        setLoaded(true);
      }
    });
    return () => {
      on = false;
    };
  }, [userId]);

  if (!loaded) return null;

  const count = BADGES.filter((b) => earned.has(b.key)).length;

  return (
    <section className="px-5 mt-10">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">LOGROS</span>
        <span className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-dim)]">
          {count}/{BADGES.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--rule)] border border-[var(--rule)]">
        {BADGES.map((b) => {
          const got = earned.has(b.key);
          return (
            <div key={b.key} className="bg-[var(--bg)] p-3">
              <div
                className={`font-mono text-[10px] tracking-[0.2em] ${
                  got ? "text-[var(--accent)]" : "text-[var(--fg-faint)]"
                }`}
              >
                {got ? "◆ " : "◇ "}
                {b.label}
              </div>
              <div className="font-mono text-[9px] tracking-[0.1em] text-[var(--fg-faint)] mt-0.5">
                {b.desc}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
