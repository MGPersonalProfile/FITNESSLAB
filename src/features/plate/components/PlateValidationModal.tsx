"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { track } from "@/shared/lib/analytics";
import { useDishAnalysis } from "@/features/scan/hooks/useDishAnalysis";
import { evaluatePlate } from "@/features/plate/lib/plate";
import PlateBalanceCard from "@/features/plate/components/PlateBalanceCard";
import { t } from "@/shared/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Standalone "validate plate" flow: captures a photo and shows only the
// Harvard plate balance. Does NOT log a meal (no DB write).
export default function PlateValidationModal({ open, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { status, preview, result, error, analyze, reset } = useDishAnalysis();

  useEffect(() => {
    if (open) {
      reset();
      track("plate_validation_started");
      setTimeout(() => fileRef.current?.click(), 100);
    }
  }, [open, reset]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const out = await analyze(file);
    if (out) {
      const plate = evaluatePlate(out.data.plato);
      track("plate_validated", {
        source: "standalone",
        score: plate.score,
        veredicto: plate.veredicto,
      });
    }
    if (fileRef.current) fileRef.current.value = "";
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
                PLATO // HARVARD
              </div>
              <div className="font-display text-lg tracking-[0.05em] text-[var(--fg)] leading-none mt-1">
                {t.plate.sectionTitle}
              </div>
            </div>
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)] hover:text-[var(--accent)] active:scale-95 transition-all"
            >
              {t.common.close}
            </button>
          </header>

          {/* CAPTURE */}
          {(status === "idle" || status === "error") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-6 flex flex-col gap-6"
            >
              <div className="text-center font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
                {t.plate.capturePrompt}
              </div>
              <div className="aspect-[4/3] border border-dashed border-[var(--rule)] flex flex-col items-center justify-center gap-3 bg-grid">
                <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)] text-center px-6">
                  EVALUAMOS EL BALANCE
                  <br />½ VERDURAS · ¼ CEREALES · ¼ PROTEÍNA
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
                {t.scan.openCamera}
              </button>
            </motion.div>
          )}

          {/* ANALYZING */}
          {status === "analyzing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-5 py-6 flex flex-col gap-6"
            >
              <div className="relative aspect-[4/3] overflow-hidden border border-[var(--rule)] bg-[var(--bg-elev)] scanline">
                {preview && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-2 left-2 right-2 font-mono text-[9px] tracking-[0.3em] text-[var(--accent)]">
                  {t.plate.evaluating}
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {status === "done" && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-5 flex flex-col gap-5"
            >
              {preview && (
                <div className="relative aspect-video overflow-hidden border border-[var(--rule)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <PlateBalanceCard data={evaluatePlate(result.plato)} />

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    reset();
                    setTimeout(() => fileRef.current?.click(), 50);
                  }}
                  className="flex-1 border border-[var(--rule)] hover:border-[var(--fg-faint)] text-[var(--fg-dim)] font-mono text-[11px] tracking-[0.3em] py-4 active:scale-[0.99] transition-transform"
                >
                  {t.plate.validateAnother}
                </button>
                <button
                  onClick={onClose}
                  className="flex-[2] bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black font-mono text-[11px] tracking-[0.3em] py-4 active:scale-[0.99] transition-transform"
                >
                  {t.plate.done}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
