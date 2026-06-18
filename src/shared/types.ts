export type MealType = "Desayuno" | "Almuerzo" | "Cena" | "Snack";

export const MEAL_TYPES: MealType[] = ["Desayuno", "Almuerzo", "Cena", "Snack"];

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  weight_kg: number | null;
  sex: "male" | "female" | null;
  birth_year: number | null;
  height_cm: number | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active" | null;
  goal: "lose" | "maintain" | "gain" | null;
  onboarded: boolean;
  updated_at: string;
};

export type FoodLog = {
  id: string;
  user_id: string;
  created_at: string;
  log_date: string;
  food_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  meal_type: MealType | null;
  image_url: string | null;
  is_ai_estimated: boolean;
  notes: string | null;
  plate_score: number | null;
  plate_eval: PlateEval | null;
};

// ===== Plate validation (Harvard Healthy Eating Plate) =====
export type PlateVerdict = "Balanceado" | "Mejorable" | "Desbalanceado";

// Raw visual proportions estimated by the AI vision model.
export type PlateAnalysis = {
  verduras_frutas_pct: number;
  cereales_pct: number;
  proteina_pct: number;
  otros_pct: number;
  detectado: string[];
  recomendacion: string;
};

// Stored evaluation: AI proportions + deterministic score/verdict.
export type PlateEval = PlateAnalysis & {
  score: number;
  veredicto: PlateVerdict;
};

export type SavedMeal = {
  id: string;
  user_id: string;
  created_at: string;
  meal_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  meal_type: MealType | null;
  times_used: number;
  last_used_at: string | null;
};

export type DailyTotal = {
  user_id: string;
  log_date: string;
  entries: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
};

export type WeightLog = {
  id: string;
  user_id: string;
  weight_kg: number;
  log_date: string;
  logged_at: string;
  notes: string | null;
};

export type AnalysisResult = {
  nombre: string;
  calorias: number;
  proteinas: number;
  grasas: number;
  carbohidratos: number;
  fibra: number;
  azucar: number;
  tipo_comida: MealType;
  plato: PlateAnalysis;
};

// ===== Social =====
export type Friend = { id: string; display_name: string | null; avatar_url: string | null };
export type FriendRequest = {
  id: string;
  requester: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ChallengeMetric = "log_days" | "plate_days";
export type Challenge = {
  id: string;
  creator: string;
  title: string;
  metric: ChallengeMetric;
  target: number;
  starts_on: string;
  ends_on: string;
  created_at: string;
};
export type ChallengeProgress = { user_id: string; display_name: string | null; value: number };

export type Macros = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
};

export const emptyMacros = (): Macros => ({
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  sugar: 0,
});

export const sumMacros = (rows: Array<Partial<Macros>>): Macros =>
  rows.reduce<Macros>(
    (acc, r) => ({
      calories: acc.calories + (r.calories ?? 0),
      protein: acc.protein + (r.protein ?? 0),
      fat: acc.fat + (r.fat ?? 0),
      carbs: acc.carbs + (r.carbs ?? 0),
      fiber: acc.fiber + (r.fiber ?? 0),
      sugar: acc.sugar + (r.sugar ?? 0),
    }),
    emptyMacros(),
  );
