import { supabase } from "@/shared/lib/supabaseClient";
import { todayMadrid } from "@/shared/lib/dates";

export const WORKOUT_KINDS = ["Pesas", "Cardio", "Otro"] as const;
export type WorkoutKind = (typeof WORKOUT_KINDS)[number];

export async function fetchWeekWorkoutMinutes(uid: string): Promise<number> {
  const since = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("workout_logs")
    .select("minutes")
    .eq("user_id", uid)
    .gte("log_date", since);
  return ((data as { minutes: number }[]) ?? []).reduce((s, r) => s + r.minutes, 0);
}

export async function addWorkout(uid: string, kind: WorkoutKind, minutes: number): Promise<void> {
  await supabase.from("workout_logs").insert({
    user_id: uid,
    kind,
    minutes,
    log_date: todayMadrid(),
  });
}
