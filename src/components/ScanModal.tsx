"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { processImage } from "@/lib/image";
import { todayMadrid } from "@/lib/dates";
import type { AnalysisResult, MealType } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";
import MealTypePicker from "@/components/MealTypePicker";

type Phase = "capture" | "analyzing" | "result" | "saved";

type Draft = {
  food_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  meal_type: MealType;
  notes: string;
};

type Props = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onDone: () => Promise<void>;
};

export default function ScanModal({ open, userId, onClose, onDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("capture");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLogId, setSavedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("capture");
      setPreview(null);
      setImageBlob(null);
      setDraft(null);
      setEdited(false);
      setError(null);
      setSavedLogId(null);
      // Auto-trigger camera shortly after open
      setTimeout(() => fileRef.current?.click(), 100);
    }
  }, [open]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPhase("analyzing");

    try {
      const { base64, blob } = await processImage(file);
      setPreview(base64);
      setImageBlob(blob);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) throw new Error("AI failed");

      const data: AnalysisResult = await res.json();
      setDraft({
        food_name: data.nombre,
        calories: data.calorias,
        protein: data.proteinas,
        fat: data.grasas,
        carbs: data.carbohidratos,
        fiber: data.fibra,
        sugar: data.azucar,
        meal_type: data.tipo_comida,
        notes: "",
      });
      setPhase("result");
    } catch (err) {
      console.error(err);
      setError("Análisis fallido. Reintenta o usa el log manual.");
      setPhase("capture");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateDraft = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
    if (k !== "meal_type") setEdited(true);
  };

  const confirm = async () => {
    if (!draft) return;

    let image_url: string | null = null;
    if (imageBlob) {
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("food-photos")
        .upload(path, imageBlob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });
      if (!upErr) image_url = path;
      else console.warn("photo upload skipped:", upErr.message);
    }

    const { data, error: insErr } = await supabase
      .from("food_logs")
      .insert({
        user_id: userId,
        food_name: draft.food_name,
        calories: draft.calories,
        protein: draft.protein,
        fat: draft.fat,
        carbs: draft.carbs,
        fiber: draft.fiber,
        sugar: draft.sugar,
        meal_type: draft.meal_type,
        notes: draft.notes || null,
        image_url,
        is_ai_estimated: !edited,
        log_date: todayMadrid(),
      })
      .select("id")
      .single();

    if (insErr) {
      console.error(insErr);
      setError("No se pudo guardar el registro.");
      return;
    }

    setSavedLogId((data as { id: string }).id);
    setPhase("saved");
    await onDone();
  };

  const saveAsFrequent = async () => {
    if (!draft) return;
    await supabase.from("saved_meals").insert({
      user_id: userId,
      meal_name: draft.food_name,
      calories: draft.calories,
      protein: draft.protein,
      fat: draft.fat,
      carbs: draft.carbs,
      fiber: draft.fiber,
      sugar: draft.sugar,
      meal_type: draft.meal_type,
    });
    onClose();
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
          {/* Hidden capture input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          {/* Header */}
          <header className="sticky top-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--rule)] px-5 py-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
                SCAN // 001
              </div>
              <div className="font-display text-lg tracking-[0.05em] text-[var(--fg)] leading-none mt-1">
                ANÁLISIS
              </div>
            </div>
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)] hover:text-[var(--accent)] active:scale-95 transition-all"
            >
              CERRAR ×
            </button>
          </header>

          {/* Phase: CAPTURE */}
          {phase === "capture" && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-6 flex flex-col gap-6"
            >
              <div className="text-center font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
                AWAITING SPECIMEN
              </div>
              <div className="aspect-[4/3] border border-dashed border-[var(--rule)] flex flex-col items-center justify-center gap-3 bg-grid">
                <svg
                  className="w-12 h-12 text-[var(--fg-faint)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.2}
                >
                  <rect x="3" y="6" width="18" height="14" />
                  <circle cx="12" cy="13" r="4" />
                  <path d="M8 6l2-3h4l2 3" />
                </svg>
                <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)]">
                  CAPTURE A PHOTO
                </div>
              </div>
              {error && (
                <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--accent)] text-center">
                  {error}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black font-mono text-[11px] tracking-[0.3em] py-4 active:scale-[0.99] transition-transform"
              >
                ABRIR CÁMARA
              </button>
            </motion.div>
          )}

          {/* Phase: ANALYZING */}
          {phase === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-5 py-6 flex flex-col gap-6"
            >
              <div className="relative aspect-[4/3] overflow-hidden border border-[var(--rule)] bg-[var(--bg-elev)] scanline">
                {preview && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between font-mono text-[9px] tracking-[0.3em] text-[var(--accent)]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-blink" />
                    REC
                  </span>
                  <span>{new Date().toISOString().slice(11, 19)}</span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 font-mono text-[9px] tracking-[0.3em] text-[var(--accent)]">
                  ANALYZING SPECIMEN...
                </div>
              </div>
              <div className="overflow-hidden whitespace-nowrap border-y border-[var(--rule)] py-3">
                <div className="inline-block animate-marquee font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)]">
                  {Array(8)
                    .fill("EXTRACTING MACROS · KCAL · PROT · FAT · CARB · FIBER · SUGAR · ")
                    .join("")}
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase: RESULT */}
          {phase === "result" && draft && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-5 flex flex-col gap-5"
            >
              {/* Preview */}
              {preview && (
                <div className="relative aspect-video overflow-hidden border border-[var(--rule)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 font-mono text-[9px] tracking-[0.3em] text-[var(--accent)] bg-black/50 px-2 py-1">
                    SPECIMEN OK
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-1.5">
                  ID
                </div>
                <input
                  value={draft.food_name}
                  onChange={(e) => updateDraft("food_name", e.target.value)}
                  className="w-full bg-transparent border-b border-[var(--rule)] focus:border-[var(--accent)] outline-none font-display text-2xl text-[var(--fg)] py-1 tracking-[0.02em]"
                />
              </div>

              {/* Meal type */}
              <div>
                <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">
                  MEAL // TYPE
                </div>
                <MealTypePicker
                  value={draft.meal_type}
                  onChange={(m) => updateDraft("meal_type", m)}
                />
              </div>

              {/* Macros editable grid */}
              <div>
                <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2 flex items-center justify-between">
                  <span>MACROS // READOUT</span>
                  {edited && (
                    <span className="text-[var(--accent)] tracking-[0.25em]">EDITED</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-px bg-[var(--rule)] border border-[var(--rule)]">
                  <NumCell label="KCAL" unit="kcal" value={draft.calories} onChange={(v) => updateDraft("calories", v)} accent />
                  <NumCell label="PROT" unit="g"    value={draft.protein}  onChange={(v) => updateDraft("protein", v)} />
                  <NumCell label="CARB" unit="g"    value={draft.carbs}    onChange={(v) => updateDraft("carbs", v)} />
                  <NumCell label="FAT"  unit="g"    value={draft.fat}      onChange={(v) => updateDraft("fat", v)} />
                  <NumCell label="FIB"  unit="g"    value={draft.fiber}    onChange={(v) => updateDraft("fiber", v)} small />
                  <NumCell label="SUG"  unit="g"    value={draft.sugar}    onChange={(v) => updateDraft("sugar", v)} small />
                </div>
              </div>

              {/* Notes (optional) */}
              <NotesField
                value={draft.notes}
                onChange={(v) => updateDraft("notes", v)}
              />

              {error && (
                <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--accent)]">
                  {error}
                </div>
              )}

              <div className="flex gap-2 sticky bottom-0 bg-[var(--bg)] pt-3 pb-2">
                <button
                  onClick={onClose}
                  className="flex-1 border border-[var(--rule)] hover:border-[var(--fg-faint)] text-[var(--fg-dim)] font-mono text-[11px] tracking-[0.3em] py-4 active:scale-[0.99] transition-transform"
                >
                  DESCARTAR
                </button>
                <button
                  onClick={confirm}
                  className="flex-[2] bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black font-mono text-[11px] tracking-[0.3em] py-4 active:scale-[0.99] transition-transform"
                >
                  CONFIRMAR & LOG
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase: SAVED */}
          {phase === "saved" && draft && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-6 flex flex-col gap-6"
            >
              <div className="border border-[var(--rule)] p-6 bg-[var(--bg-elev)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-[var(--success)] rounded-full" />
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--success)]">
                    SPECIMEN LOGGED
                  </span>
                </div>
                <div className="font-display text-2xl text-[var(--fg)] tracking-[0.02em] leading-tight">
                  {draft.food_name}
                </div>
                <div className="flex gap-4 mt-3 font-mono text-[10px] text-[var(--fg-dim)] tracking-[0.1em]">
                  <span>{draft.calories}<span className="text-[var(--fg-faint)]">kcal</span></span>
                  <span>{draft.protein}<span className="text-[var(--fg-faint)]">P</span></span>
                  <span>{draft.carbs}<span className="text-[var(--fg-faint)]">C</span></span>
                  <span>{draft.fat}<span className="text-[var(--fg-faint)]">F</span></span>
                </div>
              </div>

              <button
                onClick={saveAsFrequent}
                className="bg-transparent border border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--fg-dim)] font-mono text-[11px] tracking-[0.3em] py-4 transition-colors active:scale-[0.99]"
              >
                ★ GUARDAR EN FRECUENTES
              </button>

              <button
                onClick={onClose}
                className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)] hover:text-[var(--fg-dim)] transition-colors"
              >
                VOLVER A HOY ↩
              </button>
            </motion.div>
          )}
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
  value: number;
  onChange: (v: number) => void;
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
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        className={`w-full bg-transparent border-b border-[var(--fg-faint)]/40 focus:border-[var(--accent)] outline-none font-display mt-1 ${
          small ? "text-xl" : "text-2xl"
        } ${accent ? "text-[var(--accent)]" : "text-[var(--fg)]"}`}
      />
      <div className="font-mono text-[8px] tracking-[0.25em] text-[var(--fg-faint)] mt-0.5">
        {unit}
      </div>
    </div>
  );
}

function NotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(value.length > 0);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-left font-mono text-[10px] tracking-[0.25em] text-[var(--fg-faint)] hover:text-[var(--fg-dim)] transition-colors"
      >
        + AÑADIR NOTA
      </button>
    );
  }
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-1.5">
        NOTE
      </div>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="post-entreno, restaurante X, ..."
        className="w-full bg-[var(--bg-elev)] border border-[var(--rule)] focus:border-[var(--accent)] outline-none font-mono text-[12px] text-[var(--fg)] py-3 px-3 placeholder:text-[var(--fg-faint)]"
      />
    </div>
  );
}
