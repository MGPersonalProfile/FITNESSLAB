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

// Macro split applied to the calorie target.
const PROTEIN_G_PER_KG = 2;
const FAT_CAL_RATIO = 0.25;
const CALORIE_ROUNDING = 10;

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
  const calories = round(tdee * (1 + GOAL_DELTA[input.goal]), CALORIE_ROUNDING);

  const protein = round(PROTEIN_G_PER_KG * input.weightKg);
  const fat = round((calories * FAT_CAL_RATIO) / 9);
  const carbs = Math.max(0, round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}
