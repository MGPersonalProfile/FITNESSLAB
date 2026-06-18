import { supabase } from "@/shared/lib/supabaseClient";

export type AchievementStats = {
  total_logs: number;
  log_days: number;
  streak: number;
  best_plate: number;
  friends: number;
};

export type BadgeKey =
  | "first_log"
  | "logs_50"
  | "logs_100"
  | "streak_7"
  | "streak_30"
  | "days_30"
  | "plate_perfect"
  | "first_ally";

export type Badge = { key: BadgeKey; earned: (s: AchievementStats) => boolean };

// Badge catalogue — keys persisted once earned; labels live in i18n.
export const BADGES: Badge[] = [
  { key: "first_log", earned: (s) => s.total_logs >= 1 },
  { key: "logs_50", earned: (s) => s.total_logs >= 50 },
  { key: "logs_100", earned: (s) => s.total_logs >= 100 },
  { key: "streak_7", earned: (s) => s.streak >= 7 },
  { key: "streak_30", earned: (s) => s.streak >= 30 },
  { key: "days_30", earned: (s) => s.log_days >= 30 },
  { key: "plate_perfect", earned: (s) => s.best_plate >= 100 },
  { key: "first_ally", earned: (s) => s.friends >= 1 },
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
