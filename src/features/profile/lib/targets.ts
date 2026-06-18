export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export type TargetInput = {
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
};

export type Targets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_DELTA: Record<Goal, number> = {
  lose: -0.15,
  maintain: 0,
  gain: 0.15,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentario",
  light: "Ligero (1-2 d/sem)",
  moderate: "Moderado (3-4 d/sem)",
  active: "Activo (5-6 d/sem)",
  very_active: "Muy activo (diario)",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Perder grasa",
  maintain: "Mantener",
  gain: "Ganar músculo",
};

const round = (n: number, step = 1) => Math.round(n / step) * step;

/**
 * Mifflin-St Jeor BMR → TDEE (activity) → goal adjustment, then macro split:
 * protein 2 g/kg, fat 25% of calories, carbs fill the rest.
 */
export function computeTargets(input: TargetInput): Targets {
  const age = new Date().getFullYear() - input.birthYear;
  const s = input.sex === "male" ? 5 : -161;
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * age + s;
  const tdee = bmr * ACTIVITY_FACTOR[input.activity];
  const calories = round(tdee * (1 + GOAL_DELTA[input.goal]), 10);

  const protein = round(2 * input.weightKg);
  const fat = round((calories * 0.25) / 9);
  const carbs = Math.max(0, round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}
