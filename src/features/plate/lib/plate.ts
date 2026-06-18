import type { PlateAnalysis, PlateEval, PlateVerdict } from "@/shared/types";

// Harvard Healthy Eating Plate target proportions (by plate area):
// ½ vegetables & fruits, ¼ whole grains, ¼ protein. Everything else
// (fried foods, sauces, sugary drinks) ideally minimal.
export const HARVARD_TARGETS = {
  verduras_frutas: 50,
  cereales: 25,
  proteina: 25,
  otros: 0,
} as const;

// 0-100 balance score from the absolute deviation against the targets.
// Perfect 50/25/25/0 → 100; worst case (e.g. 100% "otros") → 0.
export function scorePlate(p: PlateAnalysis): number {
  const penalty =
    Math.abs(p.verduras_frutas_pct - HARVARD_TARGETS.verduras_frutas) +
    Math.abs(p.cereales_pct - HARVARD_TARGETS.cereales) +
    Math.abs(p.proteina_pct - HARVARD_TARGETS.proteina) +
    Math.abs(p.otros_pct - HARVARD_TARGETS.otros);
  return Math.max(0, Math.min(100, Math.round(100 - penalty / 2)));
}

// Score bands. Single source of truth for verdicts and colors across the UI.
export const PLATE_THRESHOLDS = { balanced: 80, ok: 50 } as const;

export function verdictFor(score: number): PlateVerdict {
  if (score >= PLATE_THRESHOLDS.balanced) return "Balanceado";
  if (score >= PLATE_THRESHOLDS.ok) return "Mejorable";
  return "Desbalanceado";
}

// CSS color var for a score, matching the verdict bands.
export function plateColor(score: number): string {
  if (score >= PLATE_THRESHOLDS.balanced) return "var(--success)";
  if (score >= PLATE_THRESHOLDS.ok) return "var(--warning)";
  return "var(--accent)";
}

// Combine the AI's raw proportions with a deterministic score + verdict.
export function evaluatePlate(p: PlateAnalysis): PlateEval {
  const score = scorePlate(p);
  return { ...p, score, veredicto: verdictFor(score) };
}
