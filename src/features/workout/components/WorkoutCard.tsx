"use client";

import { useEffect, useState } from "react";
import { track } from "@/shared/lib/analytics";
import {
  WORKOUT_KINDS,
  addWorkout,
  fetchWeekWorkoutMinutes,
  type WorkoutKind,
} from "@/features/workout/data";

const MINUTE_STEPS = [30, 45, 60];

export default function WorkoutCard({ userId }: { userId: string }) {
  const [weekMin, setWeekMin] = useState(0);
  const [kind, setKind] = useState<WorkoutKind>("Pesas");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let on = true;
    fetchWeekWorkoutMinutes(userId).then((m) => on && setWeekMin(m));
    return () => {
      on = false;
    };
  }, [userId]);

  const add = async (minutes: number) => {
    if (busy) return;
    setBusy(true);
    setWeekMin((m) => m + minutes); // optimistic
    try {
      await addWorkout(userId, kind, minutes);
      track("workout_added", { kind, minutes });
    } catch {
      setWeekMin((m) => m - minutes);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-[var(--rule)] p-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">
          ENTRENO // 7D
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--fg-dim)]">
          {weekMin}<span className="text-[var(--fg-faint)]"> min</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-[var(--rule)] border border-[var(--rule)] mb-2">
        {WORKOUT_KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`bg-[var(--bg)] py-2 font-mono text-[9px] tracking-[0.15em] transition-colors ${
              kind === k ? "text-[var(--accent)]" : "text-[var(--fg-dim)]"
            }`}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MINUTE_STEPS.map((m) => (
          <button
            key={m}
            onClick={() => add(m)}
            disabled={busy}
            className="border border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--fg-dim)] font-mono text-[10px] tracking-[0.15em] py-2.5 transition-colors active:scale-[0.99] disabled:opacity-50"
          >
            + {m}m
          </button>
        ))}
      </div>
    </div>
  );
}
