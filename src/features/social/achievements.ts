import { supabase } from "@/shared/lib/supabaseClient";

export type AchievementStats = {
  total_logs: number;
  log_days: number;
  streak: number;
  best_plate: number;
  friends: number;
};

export type Badge = {
  key: string;
  label: string;
  desc: string;
  earned: (s: AchievementStats) => boolean;
};

// Badge catalogue — keys persisted to the achievements table once earned.
export const BADGES: Badge[] = [
  { key: "first_log", label: "INICIADO", desc: "Tu primer registro", earned: (s) => s.total_logs >= 1 },
  { key: "logs_50", label: "CONSTANTE", desc: "50 registros", earned: (s) => s.total_logs >= 50 },
  { key: "logs_100", label: "VETERANO", desc: "100 registros", earned: (s) => s.total_logs >= 100 },
  { key: "streak_7", label: "RACHA 7", desc: "7 días seguidos", earned: (s) => s.streak >= 7 },
  { key: "streak_30", label: "RACHA 30", desc: "30 días seguidos", earned: (s) => s.streak >= 30 },
  { key: "days_30", label: "MES ACTIVO", desc: "30 días registrados", earned: (s) => s.log_days >= 30 },
  { key: "plate_perfect", label: "PLATO PERFECTO", desc: "Balance 100", earned: (s) => s.best_plate >= 100 },
  { key: "first_ally", label: "ALIADO", desc: "Tu primer amigo", earned: (s) => s.friends >= 1 },
];

export async function fetchAchievementStats(): Promise<AchievementStats> {
  const { data } = await supabase.rpc("get_achievement_stats");
  const row = (data as AchievementStats[])?.[0];
  return row ?? { total_logs: 0, log_days: 0, streak: 0, best_plate: 0, friends: 0 };
}

export async function fetchEarnedKeys(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("achievements").select("key").eq("user_id", userId);
  return new Set(((data as { key: string }[]) ?? []).map((r) => r.key));
}

// Persist any newly earned badges; returns the freshly earned keys.
export async function syncAchievements(userId: string, stats: AchievementStats, earned: Set<string>): Promise<string[]> {
  const fresh = BADGES.filter((b) => b.earned(stats) && !earned.has(b.key)).map((b) => b.key);
  if (fresh.length > 0) {
    await supabase.from("achievements").upsert(
      fresh.map((key) => ({ user_id: userId, key })),
      { onConflict: "user_id,key" },
    );
  }
  return fresh;
}
