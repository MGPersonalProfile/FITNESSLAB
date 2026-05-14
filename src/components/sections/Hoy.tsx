"use client";

import { motion } from "framer-motion";
import type { FoodLog, MealType, Profile } from "@/lib/types";
import { MEAL_TYPES, sumMacros } from "@/lib/types";
import { formatTime, todayMadrid } from "@/lib/dates";
import MacroRing from "@/components/MacroRing";

type Props = {
  profile: Profile | null;
  todayLogs: FoodLog[];
  streak: number;
  onScan: () => void;
  onManualLog: () => void;
  onEditLog: (log: FoodLog) => void;
  onDeleteLog: (id: string) => void;
};

const SECTION_FADE = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export default function Hoy({
  profile,
  todayLogs,
  streak,
  onScan,
  onManualLog,
  onEditLog,
  onDeleteLog,
}: Props) {
  const totals = sumMacros(todayLogs);

  const targets = {
    calories: profile?.target_calories ?? 2000,
    protein:  profile?.target_protein  ?? 150,
    carbs:    profile?.target_carbs    ?? 200,
    fat:      profile?.target_fat      ?? 65,
  };

  const opName =
    profile?.display_name?.toUpperCase() ??
    profile?.id?.slice(0, 8).toUpperCase() ??
    "ANON";

  const today = todayMadrid();
  const todayLabel = new Date(`${today}T12:00:00Z`)
    .toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })
    .toUpperCase();

  const byMeal = MEAL_TYPES.map((m) => ({
    type: m,
    logs: todayLogs.filter((l) => l.meal_type === m),
  }));
  const orphan = todayLogs.filter((l) => !l.meal_type);

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* HEADER — Lab report style */}
      <motion.header {...SECTION_FADE} className="px-5 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            OPERATOR
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            STREAK · {String(streak).padStart(3, "0")}D
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-[0.05em] text-[var(--fg)] mt-1 leading-none">
          {opName}
        </h1>
        <div className="flex items-baseline justify-between mt-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--fg-dim)]">
            {todayLabel}
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--accent)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-blink" />
            LIVE
          </span>
        </div>
        <div className="rule-dashed w-full mt-4" />
      </motion.header>

      {/* MACRO RINGS — 4-up grid */}
      <motion.section
        {...SECTION_FADE}
        transition={{ delay: 0.05 }}
        className="px-5"
      >
        <div className="flex items-baseline justify-between mb-5">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            READOUT // DAILY
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)]">
            {todayLogs.length} ENTRIES
          </span>
        </div>
        <div className="grid grid-cols-2 gap-y-10 gap-x-2 place-items-center">
          <MacroRing value={totals.calories} target={targets.calories} label="CAL"  unit="kcal" />
          <MacroRing value={totals.protein}  target={targets.protein}  label="PROT" unit="g" />
          <MacroRing value={totals.carbs}    target={targets.carbs}    label="CARB" unit="g" />
          <MacroRing value={totals.fat}      target={targets.fat}      label="FAT"  unit="g" />
        </div>
      </motion.section>

      {/* SCAN CTA — the hero action */}
      <motion.section
        {...SECTION_FADE}
        transition={{ delay: 0.1 }}
        className="px-5"
      >
        <button
          onClick={onScan}
          className="group w-full relative overflow-hidden bg-[var(--accent)] hover:bg-[var(--accent-dim)] transition-colors active:scale-[0.99] text-left"
        >
          {/* tick marks rail at the top */}
          <div
            className="absolute top-0 left-0 right-0 h-2 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.55) 1px, transparent 1px)",
              backgroundSize: "12px 100%",
            }}
          />
          <div className="px-5 py-6 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-[0.3em] text-black/60">
                SCAN // 001
              </span>
              <span className="font-display text-3xl tracking-[0.02em] text-black leading-none">
                ANALIZAR PLATO
              </span>
              <span className="font-mono text-[10px] tracking-[0.2em] text-black/75 mt-1">
                Cámara → IA → Macros
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 shrink-0">
              <svg
                className="w-10 h-10 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <rect x="3" y="6" width="18" height="14" rx="0" />
                <circle cx="12" cy="13" r="4" />
                <path d="M8 6l2-3h4l2 3" />
              </svg>
              <span className="font-mono text-[8px] tracking-[0.25em] text-black/70">
                →
              </span>
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-2 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.55) 1px, transparent 1px)",
              backgroundSize: "12px 100%",
            }}
          />
        </button>

        {/* Secondary: manual log */}
        <button
          onClick={onManualLog}
          className="w-full mt-2 border border-[var(--rule)] hover:border-[var(--fg-faint)] bg-transparent text-[var(--fg-dim)] hover:text-[var(--fg)] py-3 flex items-center justify-center gap-3 transition-colors active:scale-[0.99]"
        >
          <span className="font-mono text-[10px] tracking-[0.3em]">+ AÑADIR MANUAL</span>
        </button>
      </motion.section>

      {/* LOGS BY MEAL */}
      <motion.section
        {...SECTION_FADE}
        transition={{ delay: 0.15 }}
        className="px-5"
      >
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            LOGS // BY MEAL
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {byMeal.map(({ type, logs }) => (
            <MealBlock
              key={type}
              type={type}
              logs={logs}
              onEditLog={onEditLog}
              onDeleteLog={onDeleteLog}
            />
          ))}

          {orphan.length > 0 && (
            <MealBlock
              type={"Snack" as MealType}
              logs={orphan}
              forceLabel="SIN CATEGORÍA"
              onEditLog={onEditLog}
              onDeleteLog={onDeleteLog}
            />
          )}

          {todayLogs.length === 0 && (
            <div className="border border-dashed border-[var(--rule)] py-10 px-5 text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
                NO SPECIMENS LOGGED
              </div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--fg-dim)] mt-2">
                Escanea tu primera comida del día
              </div>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function MealBlock({
  type,
  logs,
  forceLabel,
  onEditLog,
  onDeleteLog,
}: {
  type: MealType;
  logs: FoodLog[];
  forceLabel?: string;
  onEditLog: (log: FoodLog) => void;
  onDeleteLog: (id: string) => void;
}) {
  if (logs.length === 0) return null;
  const t = sumMacros(logs);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">
            {forceLabel ?? type.toUpperCase()}
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-dim)]">
            {logs.length}×
          </span>
        </div>
        <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-dim)]">
          {t.calories} <span className="text-[var(--fg-faint)]">kcal</span>
        </span>
      </div>
      <div className="flex flex-col">
        {logs.map((log) => (
          <LogRow
            key={log.id}
            log={log}
            onEditLog={onEditLog}
            onDeleteLog={onDeleteLog}
          />
        ))}
      </div>
    </div>
  );
}

function LogRow({
  log,
  onEditLog,
  onDeleteLog,
}: {
  log: FoodLog;
  onEditLog: (l: FoodLog) => void;
  onDeleteLog: (id: string) => void;
}) {
  return (
    <div className="group relative flex items-stretch border-t border-[var(--rule)] last:border-b">
      <button
        onClick={() => onEditLog(log)}
        className="flex-1 text-left py-3 pr-3 flex items-center gap-3 active:bg-[var(--bg-elev)]"
      >
        <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-faint)] w-10 shrink-0">
          {formatTime(log.created_at)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[12px] text-[var(--fg)] truncate">
              {log.food_name}
            </span>
            {log.is_ai_estimated ? (
              <span className="font-mono text-[7px] tracking-[0.2em] text-[var(--fg-faint)] shrink-0">
                AI
              </span>
            ) : (
              <span className="font-mono text-[7px] tracking-[0.2em] text-[var(--accent)]/70 shrink-0">
                MAN
              </span>
            )}
          </div>
          <div className="flex gap-3 mt-0.5 font-mono text-[9px] text-[var(--fg-dim)] tracking-[0.1em]">
            <span>{log.calories}<span className="text-[var(--fg-faint)]">kcal</span></span>
            <span>{log.protein}<span className="text-[var(--fg-faint)]">P</span></span>
            <span>{log.carbs}<span className="text-[var(--fg-faint)]">C</span></span>
            <span>{log.fat}<span className="text-[var(--fg-faint)]">F</span></span>
          </div>
        </div>
      </button>
      <button
        onClick={() => onDeleteLog(log.id)}
        className="px-3 text-[var(--fg-faint)] hover:text-[var(--accent)] transition-colors"
        aria-label="Eliminar"
      >
        <span className="font-mono text-[14px]">×</span>
      </button>
    </div>
  );
}
