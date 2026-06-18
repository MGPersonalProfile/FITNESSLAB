"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/shared/lib/supabaseClient";
import { evaluatePlate } from "@/features/plate/lib/plate";
import PlateBalanceCard from "@/features/plate/components/PlateBalanceCard";
import type { PlateAnalysis } from "@/shared/types";
import { todayMadrid } from "@/shared/lib/dates";
import { track } from "@/shared/lib/analytics";
import type { FoodLog, MealType } from "@/shared/types";
import MealTypePicker from "@/shared/components/MealTypePicker";

type Mode = "manual" | "edit";

type Props = {
  open: boolean;
  mode: Mode;
  userId: string;
  initial?: FoodLog | null;
  onClose: () => void;
  onDone: () => Promise<void>;
};

type Form = {
  food_name: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  fiber: string;
  sugar: string;
  meal_type: MealType;
  notes: string;
};

const blank: Form = {
  food_name: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
  fiber: "",
  sugar: "",
  meal_type: "Almuerzo",
  notes: "",
};

const intOr0 = (s: string) => {
  const n = parseInt(s || "0", 10);
  return isFinite(n) ? n : 0;
};

export default function LogFormModal({
  open,
  mode,
  userId,
  initial,
  onClose,
  onDone,
}: Props) {
  const formFromProps = (): Form =>
    mode === "edit" && initial
      ? {
          food_name: initial.food_name,
          calories: String(initial.calories),
          protein: String(initial.protein),
          fat: String(initial.fat),
          carbs: String(initial.carbs),
          fiber: String(initial.fiber),
          sugar: String(initial.sugar),
          meal_type: initial.meal_type ?? "Almuerzo",
          notes: initial.notes ?? "",
        }
      : blank;

  const [form, setForm] = useState<Form>(blank);
  const [plate, setPlate] = useState<PlateAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Populate the form when the modal opens — adjusting state during render.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setError(null);
      setForm(formFromProps());
      setPlate(mode === "edit" && initial?.plate_eval ? initial.plate_eval : null);
    }
  }

  const setPlatePct = (k: keyof PlateAnalysis, v: number) =>
    setPlate((p) => (p ? { ...p, [k]: Math.max(0, Math.min(100, v)) } : p));

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!form.food_name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);

    const plateEval = plate ? evaluatePlate(plate) : null;
    const payload = {
      food_name: form.food_name.trim(),
      calories: intOr0(form.calories),
      protein: intOr0(form.protein),
      fat: intOr0(form.fat),
      carbs: intOr0(form.carbs),
      fiber: intOr0(form.fiber),
      sugar: intOr0(form.sugar),
      meal_type: form.meal_type,
      notes: form.notes.trim() || null,
      is_ai_estimated: false,
      plate_score: plateEval?.score ?? null,
      plate_eval: plateEval,
    };

    if (mode === "edit" && initial) {
      const { error: e } = await supabase
        .from("food_logs")
        .update(payload)
        .eq("id", initial.id);
      if (e) {
        console.error(e);
        setError("No se pudo guardar.");
        setSaving(false);
        return;
      }
      track("log_edited", { meal_type: payload.meal_type });
    } else {
      const { error: e } = await supabase.from("food_logs").insert({
        ...payload,
        user_id: userId,
        log_date: todayMadrid(),
      });
      if (e) {
        console.error(e);
        setError("No se pudo guardar.");
        setSaving(false);
        return;
      }
      track("manual_log_added", {
        meal_type: payload.meal_type,
        calories: payload.calories,
      });
    }

    await onDone();
    setSaving(false);
    onClose();
  };

  const remove = async () => {
    if (mode !== "edit" || !initial) return;
    setDeleting(true);
    const { error: e } = await supabase
      .from("food_logs")
      .delete()
      .eq("id", initial.id);
    if (e) {
      console.error(e);
      setError("No se pudo eliminar.");
      setDeleting(false);
      return;
    }
    track("log_deleted", { meal_type: initial.meal_type });
    await onDone();
    setDeleting(false);
    onClose();
  };

  const title = mode === "edit" ? "EDITAR" : "MANUAL";
  const code = mode === "edit" ? "002" : "003";

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
          <header className="sticky top-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--rule)] px-5 py-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
                LOG // {code}
              </div>
              <div className="font-display text-lg tracking-[0.05em] text-[var(--fg)] leading-none mt-1">
                {title}
              </div>
            </div>
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)] hover:text-[var(--accent)]"
            >
              CERRAR ×
            </button>
          </header>

          <div className="px-5 py-5 flex flex-col gap-5">
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-1.5">
                ID
              </div>
              <input
                value={form.food_name}
                onChange={(e) => set("food_name", e.target.value)}
                placeholder="ej. Pollo con arroz"
                className="w-full bg-transparent border-b border-[var(--rule)] focus:border-[var(--accent)] outline-none font-display text-2xl text-[var(--fg)] py-1 placeholder:text-[var(--fg-faint)]"
              />
            </div>

            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">
                MEAL // TYPE
              </div>
              <MealTypePicker
                value={form.meal_type}
                onChange={(m) => set("meal_type", m)}
              />
            </div>

            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">
                MACROS // READOUT
              </div>
              <div className="grid grid-cols-2 gap-px bg-[var(--rule)] border border-[var(--rule)]">
                <NumCell label="KCAL" unit="kcal" value={form.calories} onChange={(v) => set("calories", v)} accent />
                <NumCell label="PROT" unit="g"    value={form.protein}  onChange={(v) => set("protein", v)} />
                <NumCell label="CARB" unit="g"    value={form.carbs}    onChange={(v) => set("carbs", v)} />
                <NumCell label="FAT"  unit="g"    value={form.fat}      onChange={(v) => set("fat", v)} />
                <NumCell label="FIB"  unit="g"    value={form.fiber}    onChange={(v) => set("fiber", v)} small />
                <NumCell label="SUG"  unit="g"    value={form.sugar}    onChange={(v) => set("sugar", v)} small />
              </div>
            </div>

            {/* Plate balance — editable proportions, recomputed on save */}
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2 flex items-center justify-between">
                <span>BALANCE // PLATO</span>
                {plate && (
                  <button
                    onClick={() => setPlate(null)}
                    className="text-[var(--fg-faint)] hover:text-[var(--accent)] tracking-[0.25em]"
                  >
                    QUITAR ×
                  </button>
                )}
              </div>
              {plate ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-px bg-[var(--rule)] border border-[var(--rule)]">
                    <NumCell label="VERD/FRUTA" unit="%" value={String(plate.verduras_frutas_pct)} onChange={(v) => setPlatePct("verduras_frutas_pct", parseInt(v || "0", 10))} small />
                    <NumCell label="CEREALES" unit="%" value={String(plate.cereales_pct)} onChange={(v) => setPlatePct("cereales_pct", parseInt(v || "0", 10))} small />
                    <NumCell label="PROTEÍNA" unit="%" value={String(plate.proteina_pct)} onChange={(v) => setPlatePct("proteina_pct", parseInt(v || "0", 10))} small />
                    <NumCell label="OTROS" unit="%" value={String(plate.otros_pct)} onChange={(v) => setPlatePct("otros_pct", parseInt(v || "0", 10))} small />
                  </div>
                  <PlateBalanceCard data={evaluatePlate(plate)} />
                </div>
              ) : (
                <button
                  onClick={() =>
                    setPlate({
                      verduras_frutas_pct: 50,
                      cereales_pct: 25,
                      proteina_pct: 25,
                      otros_pct: 0,
                      detectado: [],
                      recomendacion: "",
                    })
                  }
                  className="w-full border border-dashed border-[var(--rule)] hover:border-[var(--fg-faint)] text-[var(--fg-faint)] hover:text-[var(--fg-dim)] font-mono text-[10px] tracking-[0.3em] py-3 transition-colors"
                >
                  + AÑADIR BALANCE DE PLATO
                </button>
              )}
            </div>

            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-1.5">
                NOTE
              </div>
              <input
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="opcional"
                className="w-full bg-[var(--bg-elev)] border border-[var(--rule)] focus:border-[var(--accent)] outline-none font-mono text-[12px] text-[var(--fg)] py-3 px-3 placeholder:text-[var(--fg-faint)]"
              />
            </div>

            {error && (
              <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--accent)]">
                {error}
              </div>
            )}

            <div className="flex gap-2 sticky bottom-0 bg-[var(--bg)] pt-3 pb-2">
              {mode === "edit" ? (
                <button
                  onClick={remove}
                  disabled={deleting}
                  className="flex-1 border border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--fg-dim)] font-mono text-[10px] tracking-[0.3em] py-4 transition-colors active:scale-[0.99]"
                >
                  {deleting ? "..." : "ELIMINAR"}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex-1 border border-[var(--rule)] hover:border-[var(--fg-faint)] text-[var(--fg-dim)] font-mono text-[10px] tracking-[0.3em] py-4 active:scale-[0.99] transition-transform"
                >
                  CANCELAR
                </button>
              )}
              <button
                onClick={submit}
                disabled={saving}
                className="flex-[2] bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-black font-mono text-[11px] tracking-[0.3em] py-4 active:scale-[0.99] transition-transform"
              >
                {saving ? "..." : mode === "edit" ? "GUARDAR" : "AÑADIR A HOY"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NumCell({
  label,
  unit,
  value,
  onChange,
  accent,
  small,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-[var(--bg)] p-3">
      <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">
        {label}
      </div>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="0"
        className={`w-full bg-transparent border-b border-[var(--fg-faint)]/40 focus:border-[var(--accent)] outline-none font-display mt-1 placeholder:text-[var(--fg-faint)]/40 ${
          small ? "text-xl" : "text-2xl"
        } ${accent ? "text-[var(--accent)]" : "text-[var(--fg)]"}`}
      />
      <div className="font-mono text-[8px] tracking-[0.25em] text-[var(--fg-faint)] mt-0.5">
        {unit}
      </div>
    </div>
  );
}
