import { supabase } from "@/shared/lib/supabaseClient";

export type PlateTrendPoint = { date: string; avg: number };

// Daily average plate_score over the last `days` (logs that have a score).
export async function fetchPlateTrend(uid: string, days = 30): Promise<PlateTrendPoint[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("food_logs")
    .select("log_date, plate_score")
    .eq("user_id", uid)
    .not("plate_score", "is", null)
    .gte("log_date", since)
    .order("log_date", { ascending: true });

  const rows = (data as { log_date: string; plate_score: number }[]) ?? [];
  const byDay = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const e = byDay.get(r.log_date) ?? { sum: 0, n: 0 };
    e.sum += r.plate_score;
    e.n += 1;
    byDay.set(r.log_date, e);
  }
  return [...byDay.entries()].map(([date, { sum, n }]) => ({
    date,
    avg: Math.round(sum / n),
  }));
}
