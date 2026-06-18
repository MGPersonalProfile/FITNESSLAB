"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/shared/lib/supabaseClient";
import { track } from "@/shared/lib/analytics";
import { CALIBRATION, clamp } from "@/shared/config";
import type { Profile } from "@/shared/types";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  computeTargets,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/features/profile/lib/targets";

type Props = {
  open: boolean;
  userId: string;
  onDone: (profile: Profile) => void;
};

const CURRENT_YEAR = new Date().getFullYear();

export default function OnboardingModal({ open, userId, onDone }: Props) {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState<number>(CALIBRATION.age.default);
  const [heightCm, setHeightCm] = useState<number>(CALIBRATION.height.default);
  const [weightKg, setWeightKg] = useState<number>(CALIBRATION.weight.default);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const birthYear = CURRENT_YEAR - age;
  const targets = useMemo(
    () => computeTargets({ sex, birthYear, heightCm, weightKg, activity, goal }),
    [sex, birthYear, heightCm, weightKg, activity, goal],
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("profiles")
      .update({
        sex,
        birth_year: birthYear,
        height_cm: heightCm,
        weight_kg: weightKg,
        activity_level: activity,
        goal,
        target_calories: targets.calories,
        target_protein: targets.protein,
        target_carbs: targets.carbs,
        target_fat: targets.fat,
        onboarded: true,
      })
      .eq("id", userId)
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError("No se pudo guardar. Reintenta.");
      return;
    }
    track("onboarding_completed", { goal, activity });
    onDone(data as Profile);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[var(--bg)] overflow-y-auto"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <header className="sticky top-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--rule)] px-5 py-4">
            <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
              SETUP // 000
            </div>
            <div className="font-display text-lg tracking-[0.05em] text-[var(--fg)] leading-none mt-1">
              CALIBRACIÓN
            </div>
          </header>

          <div className="px-5 py-6 flex flex-col gap-6">
            <p className="font-mono text-[10px] tracking-[0.15em] text-[var(--fg-dim)] leading-relaxed">
              Calculamos tus objetivos diarios (Mifflin-St Jeor). Puedes ajustarlos luego en tu perfil.
            </p>

            {/* Sex */}
            <Field label="SEXO">
              <Toggle
                options={[
                  { v: "male", l: "HOMBRE" },
                  { v: "female", l: "MUJER" },
                ]}
                value={sex}
                onChange={(v) => setSex(v as Sex)}
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <NumField label="EDAD" unit="años" value={age} onChange={setAge} min={CALIBRATION.age.min} max={CALIBRATION.age.max} />
              <NumField label="ALTURA" unit="cm" value={heightCm} onChange={setHeightCm} min={CALIBRATION.height.min} max={CALIBRATION.height.max} />
              <NumField label="PESO" unit="kg" value={weightKg} onChange={setWeightKg} min={CALIBRATION.weight.min} max={CALIBRATION.weight.max} />
            </div>

            {/* Activity */}
            <Field label="ACTIVIDAD">
              <div className="grid grid-cols-1 gap-px bg-[var(--rule)] border border-[var(--rule)]">
                {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setActivity(a)}
                    className={`bg-[var(--bg)] text-left px-3 py-2.5 font-mono text-[11px] tracking-[0.15em] transition-colors ${
                      activity === a ? "text-[var(--accent)]" : "text-[var(--fg-dim)] hover:text-[var(--fg)]"
                    }`}
                  >
                    {activity === a ? "▸ " : "  "}
                    {ACTIVITY_LABELS[a]}
                  </button>
                ))}
              </div>
            </Field>

            {/* Goal */}
            <Field label="OBJETIVO">
              <Toggle
                options={(Object.keys(GOAL_LABELS) as Goal[]).map((g) => ({ v: g, l: GOAL_LABELS[g].toUpperCase() }))}
                value={goal}
                onChange={(v) => setGoal(v as Goal)}
              />
            </Field>

            {/* Computed preview */}
            <div className="border border-[var(--rule)]">
              <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] px-4 pt-3">
                OBJETIVOS // CALCULADOS
              </div>
              <div className="grid grid-cols-4 gap-px bg-[var(--rule)] border-t border-[var(--rule)] mt-3">
                <Stat label="KCAL" value={targets.calories} accent />
                <Stat label="PROT" value={targets.protein} />
                <Stat label="CARB" value={targets.carbs} />
                <Stat label="FAT" value={targets.fat} />
              </div>
            </div>

            {error && (
              <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--accent)]">{error}</div>
            )}

            <button
              onClick={save}
              disabled={saving}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-black font-mono text-[11px] tracking-[0.3em] py-4 active:scale-[0.99] transition-transform"
            >
              {saving ? "GUARDANDO..." : "EMPEZAR →"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  options,
  value,
  onChange,
}: {
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-px bg-[var(--rule)] border border-[var(--rule)]" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`bg-[var(--bg)] py-2.5 font-mono text-[10px] tracking-[0.2em] transition-colors ${
            value === o.v ? "text-[var(--accent)]" : "text-[var(--fg-dim)] hover:text-[var(--fg)]"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function NumField({
  label,
  unit,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  // Local draft string so the user can clear/type freely; clamp only on blur.
  const [draft, setDraft] = useState(String(value));

  // Keep the draft in sync if the value changes from outside.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(String(value));
  }

  const commit = () => {
    const n = parseInt(draft, 10);
    const next = clamp(Number.isFinite(n) ? n : min, min, max);
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div className="border border-[var(--rule)] p-3">
      <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">{label}</div>
      <input
        type="number"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className="w-full bg-transparent border-b border-[var(--fg-faint)]/40 focus:border-[var(--accent)] outline-none font-display text-2xl text-[var(--fg)] mt-1"
      />
      <div className="font-mono text-[8px] tracking-[0.25em] text-[var(--fg-faint)] mt-0.5">{unit}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-[var(--bg)] p-3">
      <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">{label}</div>
      <div className={`font-display text-2xl mt-1 ${accent ? "text-[var(--accent)]" : "text-[var(--fg)]"}`}>
        {value}
      </div>
    </div>
  );
}
