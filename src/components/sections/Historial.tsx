"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { DailyTotal, FoodLog, Profile } from "@/lib/types";
import { formatRelativeDay, formatTime, todayMadrid } from "@/lib/dates";

type Props = {
  userId: string;
  profile: Profile | null;
};

export default function Historial({ userId, profile }: Props) {
  const [days, setDays] = useState<DailyTotal[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dayLogs, setDayLogs] = useState<Record<string, FoodLog[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const today = todayMadrid();
      const { data, error } = await supabase
        .from("daily_totals")
        .select("*")
        .lt("log_date", today)
        .order("log_date", { ascending: false })
        .limit(120);
      if (!mounted) return;
      if (error) console.error("daily_totals", error);
      setDays((data as DailyTotal[]) ?? []);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const toggleDay = async (logDate: string) => {
    if (expanded === logDate) {
      setExpanded(null);
      return;
    }
    setExpanded(logDate);
    if (!dayLogs[logDate]) {
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("log_date", logDate)
        .order("created_at", { ascending: true });
      if (error) console.error("food_logs day", error);
      setDayLogs((d) => ({ ...d, [logDate]: (data as FoodLog[]) ?? [] }));
    }
  };

  const target = profile?.target_calories ?? 2000;

  return (
    <div className="flex flex-col pb-8">
      <header className="px-5 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            ARCHIVE // 02
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)]">
            {days.length} DAYS
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-[0.05em] text-[var(--fg)] mt-1 leading-none">
          HISTORIAL
        </h1>
        <div className="rule-dashed w-full mt-4" />
      </header>

      <section className="mt-6">
        {loading && (
          <div className="px-5 font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            LOADING ARCHIVE...
          </div>
        )}

        {!loading && days.length === 0 && (
          <div className="mx-5 border border-dashed border-[var(--rule)] py-10 px-5 text-center">
            <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
              NO ARCHIVED DAYS
            </div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--fg-dim)] mt-2">
              Tu primer día se archivará al cambiar la fecha
            </div>
          </div>
        )}

        <ul>
          {days.map((d, idx) => {
            const pct = target > 0 ? Math.min(1.5, d.calories / target) : 0;
            const isOpen = expanded === d.log_date;
            return (
              <li key={d.log_date} className="border-t border-[var(--rule)] last:border-b">
                <button
                  onClick={() => toggleDay(d.log_date)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 active:bg-[var(--bg-elev)] transition-colors"
                >
                  <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-faint)] w-8 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[11px] tracking-[0.2em] text-[var(--fg)]">
                        {formatRelativeDay(d.log_date)}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--fg-dim)]">
                        {d.entries}× · {d.calories}
                        <span className="text-[var(--fg-faint)]"> kcal</span>
                      </span>
                    </div>
                    {/* mini bar of calories vs target */}
                    <div className="relative w-full h-[3px] mt-2 bg-[var(--bg-elev-2)]">
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${Math.min(100, (pct / 1.5) * 100)}%`,
                          background:
                            pct > 1 ? "var(--warning)" : "var(--accent)",
                        }}
                      />
                      {/* target marker at 100% (mapped to 66.6%) */}
                      <div
                        className="absolute inset-y-0 w-px bg-[var(--fg-faint)]"
                        style={{ left: `${(1 / 1.5) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-3 mt-2 font-mono text-[9px] text-[var(--fg-dim)] tracking-[0.1em]">
                      <span>{d.protein}<span className="text-[var(--fg-faint)]">P</span></span>
                      <span>{d.carbs}<span className="text-[var(--fg-faint)]">C</span></span>
                      <span>{d.fat}<span className="text-[var(--fg-faint)]">F</span></span>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[12px] text-[var(--fg-faint)] transition-transform shrink-0 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  >
                    ▸
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden bg-[var(--bg-elev)]"
                    >
                      <div className="pl-12 pr-5 pb-3 pt-1">
                        {(dayLogs[d.log_date] ?? []).map((log) => (
                          <div
                            key={log.id}
                            className="flex items-baseline gap-3 py-1.5 border-t border-[var(--rule)] first:border-t-0"
                          >
                            <span className="font-mono text-[9px] tracking-[0.15em] text-[var(--fg-faint)] w-10 shrink-0">
                              {formatTime(log.created_at)}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--fg)] flex-1 truncate">
                              {log.food_name}
                            </span>
                            <span className="font-mono text-[9px] text-[var(--fg-dim)] tracking-[0.1em]">
                              {log.calories}
                              <span className="text-[var(--fg-faint)]"> kcal</span>
                            </span>
                          </div>
                        ))}
                        {(dayLogs[d.log_date]?.length ?? 0) === 0 && (
                          <div className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-faint)] py-2">
                            ...
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
