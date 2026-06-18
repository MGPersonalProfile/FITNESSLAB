"use client";

import { useCallback, useEffect, useState } from "react";
import { track } from "@/shared/lib/analytics";
import type { Challenge, ChallengeMetric, ChallengeProgress } from "@/shared/types";
import {
  createChallenge,
  fetchActiveChallenges,
  fetchChallengeProgress,
  fetchMyChallengeIds,
  joinChallenge,
  leaveChallenge,
} from "@/features/social/challenges";
import { CHALLENGE, clamp } from "@/shared/config";
import { t } from "@/shared/i18n";

const METRIC_LABEL: Record<ChallengeMetric, string> = t.challenges.metric;

export default function Challenges({ userId }: { userId: string }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, ChallengeProgress[]>>({});
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState<ChallengeMetric>("log_days");
  const [target, setTarget] = useState<number>(CHALLENGE.defaultTarget);

  const reload = useCallback(async () => {
    const [list, ids] = await Promise.all([fetchActiveChallenges(), fetchMyChallengeIds(userId)]);
    setChallenges(list);
    setMine(ids);
    const prog: Record<string, ChallengeProgress[]> = {};
    await Promise.all(
      list.filter((c) => ids.has(c.id)).map(async (c) => {
        prog[c.id] = await fetchChallengeProgress(c.id);
      }),
    );
    setProgress(prog);
  }, [userId]);

  useEffect(() => {
    // setState only inside the resolved callback.
    Promise.all([fetchActiveChallenges(), fetchMyChallengeIds(userId)]).then(async ([list, ids]) => {
      setChallenges(list);
      setMine(ids);
      const prog: Record<string, ChallengeProgress[]> = {};
      await Promise.all(
        list.filter((c) => ids.has(c.id)).map(async (c) => {
          prog[c.id] = await fetchChallengeProgress(c.id);
        }),
      );
      setProgress(prog);
    });
  }, [userId]);

  const create = async () => {
    if (!title.trim()) return;
    await createChallenge(userId, title.trim(), metric, target, CHALLENGE.durationDays);
    track("challenge_created", { metric, target });
    setTitle("");
    setCreating(false);
    await reload();
  };

  const join = async (cid: string) => {
    await joinChallenge(cid, userId);
    track("challenge_joined");
    await reload();
  };

  const leave = async (cid: string) => {
    await leaveChallenge(cid, userId);
    await reload();
  };

  return (
    <section className="px-5 mt-8">
      <div className="flex items-center justify-between mb-2">
        <span className="mono-label">{t.challenges.title}</span>
        <button
          onClick={() => setCreating((v) => !v)}
          className="font-mono text-[9px] tracking-[0.25em] text-[var(--accent)] hover:opacity-70"
        >
          {creating ? t.common.cancel : t.challenges.create}
        </button>
      </div>

      {creating && (
        <div className="border border-[var(--rule)] p-3 mb-3 flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.challenges.namePlaceholder}
            className="bg-[var(--bg-elev)] border border-[var(--rule)] focus:border-[var(--accent)] outline-none font-mono text-[12px] text-[var(--fg)] py-2.5 px-3 placeholder:text-[var(--fg-faint)]"
          />
          <div className="grid grid-cols-2 gap-px bg-[var(--rule)] border border-[var(--rule)]">
            {(Object.keys(METRIC_LABEL) as ChallengeMetric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`bg-[var(--bg)] py-2 font-mono text-[9px] tracking-[0.15em] ${
                  metric === m ? "text-[var(--accent)]" : "text-[var(--fg-dim)]"
                }`}
              >
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[var(--fg-dim)]">
            <span>{t.challenges.goalWord}</span>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(clamp(parseInt(e.target.value || "1", 10), 1, CHALLENGE.maxTarget))}
              className="w-16 bg-transparent border-b border-[var(--rule)] focus:border-[var(--accent)] outline-none font-display text-xl text-[var(--fg)] text-center"
            />
            <span className="text-[var(--fg-faint)]">/ {CHALLENGE.maxTarget} {t.challenges.days}</span>
          </div>
          <button
            onClick={create}
            className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black font-mono text-[10px] tracking-[0.3em] py-3 active:scale-[0.99]"
          >
            {t.challenges.createBtn}
          </button>
        </div>
      )}

      {challenges.length === 0 ? (
        <div className="border border-dashed border-[var(--rule)] py-6 text-center font-mono text-[10px] tracking-[0.2em] text-[var(--fg-faint)]">
          {t.challenges.none}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {challenges.map((c) => {
            const joined = mine.has(c.id);
            const rank = progress[c.id] ?? [];
            return (
              <div key={c.id} className="border border-[var(--rule)] p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg text-[var(--fg)] leading-none">{c.title}</span>
                  {joined ? (
                    <button onClick={() => leave(c.id)} className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-faint)] hover:text-[var(--accent)]">
                      {t.challenges.leave}
                    </button>
                  ) : (
                    <button onClick={() => join(c.id)} className="font-mono text-[9px] tracking-[0.2em] text-[var(--accent)] hover:opacity-70">
                      {t.challenges.join}
                    </button>
                  )}
                </div>
                <div className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-faint)] mt-1">
                  {METRIC_LABEL[c.metric]} · {t.challenges.goalWord} {c.target}/{CHALLENGE.maxTarget} · HASTA {c.ends_on.slice(5)}
                </div>
                {joined && rank.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {rank.map((r) => {
                      const pct = Math.min(100, Math.round((r.value / c.target) * 100));
                      const me = r.user_id === userId;
                      return (
                        <div key={r.user_id} className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] w-20 truncate ${me ? "text-[var(--accent)]" : "text-[var(--fg-dim)]"}`}>
                            {r.display_name ?? "Anón"}
                          </span>
                          <div className="flex-1 h-1.5 bg-[var(--bg-elev)] border border-[var(--rule)]">
                            <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-[9px] text-[var(--fg-dim)] w-8 text-right">
                            {r.value}/{c.target}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
