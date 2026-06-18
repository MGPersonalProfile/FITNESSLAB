// Central app configuration — tunable behavioural values that used to be
// hardcoded across the frontend. Change a number here, not in N components.

import type { Macros } from "@/shared/types";

/** Fallback daily targets when a profile has none set yet. */
export const DEFAULT_TARGETS: Pick<Macros, "calories" | "protein" | "carbs" | "fat"> = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

/** Calibration (onboarding) numeric input ranges + sensible defaults. */
export const CALIBRATION = {
  age: { min: 12, max: 100, default: 25 },
  height: { min: 120, max: 230, default: 175 },
  weight: { min: 30, max: 250, default: 75 },
} as const;

/** Hydration tracking. */
export const HYDRATION = {
  goalMl: 2500,
  stepsMl: [250, 500] as const,
};

/** Workout quick-add. */
export const WORKOUT = {
  minuteSteps: [30, 45, 60] as const,
};

/** Weekly challenges. */
export const CHALLENGE = {
  defaultTarget: 7,
  maxTarget: 7,
  durationDays: 7,
} as const;

/** AI scan quota (guards the shared Gemini free-tier quota). */
export const AI = {
  dailyScanCap: 30,
} as const;

/** Thresholds for the daily insights coaching. */
export const INSIGHTS = {
  sugarMaxG: 50,
  fiberMinG: 20,
  caloriesOverRatio: 1.1,
  proteinLowRatio: 0.6,
  minLogsForFiberHint: 2,
} as const;

/** Clamp a value into [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
