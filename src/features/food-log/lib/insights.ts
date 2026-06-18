import type { FoodLog, Profile } from "@/shared/types";
import { sumMacros } from "@/shared/types";
import { DEFAULT_TARGETS, INSIGHTS } from "@/shared/config";
import { PLATE_THRESHOLDS } from "@/features/plate/lib/plate";

export type InsightLevel = "good" | "warn" | "info";
export type Insight = { level: InsightLevel; text: string };

/**
 * Lightweight, client-side daily coaching from today's logs vs targets.
 * Returns at most 3 messages, prioritising warnings.
 */
export function dailyInsights(logs: FoodLog[], profile: Profile | null): Insight[] {
  if (logs.length === 0) return [];

  const t = sumMacros(logs);
  const targetCal = profile?.target_calories ?? DEFAULT_TARGETS.calories;
  const targetProt = profile?.target_protein ?? DEFAULT_TARGETS.protein;

  const warns: Insight[] = [];
  const infos: Insight[] = [];

  if (t.calories > targetCal * INSIGHTS.caloriesOverRatio) {
    warns.push({ level: "warn", text: `Te pasaste de calorías (${t.calories}/${targetCal} kcal).` });
  }
  if (t.protein < targetProt * INSIGHTS.proteinLowRatio) {
    warns.push({ level: "warn", text: `Vas corto de proteína (${t.protein}/${targetProt} g).` });
  }
  if (t.sugar > INSIGHTS.sugarMaxG) {
    warns.push({ level: "warn", text: `Azúcar alto hoy (${t.sugar} g).` });
  }
  if (t.fiber < INSIGHTS.fiberMinG && logs.length >= INSIGHTS.minLogsForFiberHint) {
    infos.push({ level: "info", text: `Poca fibra (${t.fiber} g) — suma verduras o fruta.` });
  }

  const plated = logs.filter((l) => l.plate_score != null);
  if (plated.length > 0) {
    const avg = Math.round(plated.reduce((s, l) => s + (l.plate_score ?? 0), 0) / plated.length);
    if (avg < PLATE_THRESHOLDS.ok) warns.push({ level: "warn", text: `Balance de plato bajo hoy (${avg}/100).` });
  }

  const result = [...warns, ...infos];
  if (result.length === 0) {
    result.push({ level: "good", text: "Buen día: tus macros van en rango." });
  }
  return result.slice(0, 3);
}
