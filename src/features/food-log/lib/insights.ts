import type { FoodLog, Profile } from "@/shared/types";
import { sumMacros } from "@/shared/types";

export type InsightLevel = "good" | "warn" | "info";
export type Insight = { level: InsightLevel; text: string };

/**
 * Lightweight, client-side daily coaching from today's logs vs targets.
 * Returns at most 3 messages, prioritising warnings.
 */
export function dailyInsights(logs: FoodLog[], profile: Profile | null): Insight[] {
  if (logs.length === 0) return [];

  const t = sumMacros(logs);
  const targetCal = profile?.target_calories ?? 2000;
  const targetProt = profile?.target_protein ?? 150;

  const warns: Insight[] = [];
  const infos: Insight[] = [];

  if (t.calories > targetCal * 1.1) {
    warns.push({ level: "warn", text: `Te pasaste de calorías (${t.calories}/${targetCal} kcal).` });
  }
  if (t.protein < targetProt * 0.6) {
    warns.push({ level: "warn", text: `Vas corto de proteína (${t.protein}/${targetProt} g).` });
  }
  if (t.sugar > 50) {
    warns.push({ level: "warn", text: `Azúcar alto hoy (${t.sugar} g).` });
  }
  if (t.fiber < 20 && logs.length >= 2) {
    infos.push({ level: "info", text: `Poca fibra (${t.fiber} g) — suma verduras o fruta.` });
  }

  const plated = logs.filter((l) => l.plate_score != null);
  if (plated.length > 0) {
    const avg = Math.round(plated.reduce((s, l) => s + (l.plate_score ?? 0), 0) / plated.length);
    if (avg < 50) warns.push({ level: "warn", text: `Balance de plato bajo hoy (${avg}/100).` });
  }

  const result = [...warns, ...infos];
  if (result.length === 0) {
    result.push({ level: "good", text: "Buen día: tus macros van en rango." });
  }
  return result.slice(0, 3);
}
