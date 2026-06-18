import type { FoodLog, Profile } from "@/shared/types";
import { sumMacros } from "@/shared/types";
import { DEFAULT_TARGETS, INSIGHTS } from "@/shared/config";
import { PLATE_THRESHOLDS } from "@/features/plate/lib/plate";
import { t } from "@/shared/i18n";

export type InsightLevel = "good" | "warn" | "info";
export type Insight = { level: InsightLevel; text: string };

/**
 * Lightweight, client-side daily coaching from today's logs vs targets.
 * Returns at most 3 messages, prioritising warnings.
 */
export function dailyInsights(logs: FoodLog[], profile: Profile | null): Insight[] {
  if (logs.length === 0) return [];

  const totals = sumMacros(logs);
  const targetCal = profile?.target_calories ?? DEFAULT_TARGETS.calories;
  const targetProt = profile?.target_protein ?? DEFAULT_TARGETS.protein;

  const warns: Insight[] = [];
  const infos: Insight[] = [];

  const m = t.insights;
  if (totals.calories > targetCal * INSIGHTS.caloriesOverRatio) {
    warns.push({ level: "warn", text: m.caloriesOver(totals.calories, targetCal) });
  }
  if (totals.protein < targetProt * INSIGHTS.proteinLowRatio) {
    warns.push({ level: "warn", text: m.proteinLow(totals.protein, targetProt) });
  }
  if (totals.sugar > INSIGHTS.sugarMaxG) {
    warns.push({ level: "warn", text: m.sugarHigh(totals.sugar) });
  }
  if (totals.fiber < INSIGHTS.fiberMinG && logs.length >= INSIGHTS.minLogsForFiberHint) {
    infos.push({ level: "info", text: m.fiberLow(totals.fiber) });
  }

  const plated = logs.filter((l) => l.plate_score != null);
  if (plated.length > 0) {
    const avg = Math.round(plated.reduce((s, l) => s + (l.plate_score ?? 0), 0) / plated.length);
    if (avg < PLATE_THRESHOLDS.ok) warns.push({ level: "warn", text: m.plateLow(avg) });
  }

  const result = [...warns, ...infos];
  if (result.length === 0) {
    result.push({ level: "good", text: m.onTrack });
  }
  return result.slice(0, 3);
}
