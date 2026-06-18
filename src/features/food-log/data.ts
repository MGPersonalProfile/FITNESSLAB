import { supabase } from "@/shared/lib/supabaseClient";
import { todayMadrid } from "@/shared/lib/dates";
import type { FoodLog, Profile, SavedMeal } from "@/shared/types";

// Pure data fetchers — return data, never touch React state. Callers wire
// the results into state (in event handlers or effect callbacks).

export async function fetchProfile(uid: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
  return (data as Profile) ?? null;
}

export async function fetchToday(uid: string): Promise<FoodLog[]> {
  const { data } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", uid)
    .eq("log_date", todayMadrid())
    .order("created_at", { ascending: true });
  return (data as FoodLog[]) ?? [];
}

export async function fetchSaved(uid: string): Promise<SavedMeal[]> {
  const { data } = await supabase
    .from("saved_meals")
    .select("*")
    .eq("user_id", uid)
    .order("times_used", { ascending: false })
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data as SavedMeal[]) ?? [];
}

export async function fetchStreak(uid: string): Promise<number> {
  const { data } = await supabase.rpc("get_user_streak", { user_uuid: uid });
  return typeof data === "number" ? data : 0;
}

export type Dashboard = {
  profile: Profile | null;
  today: FoodLog[];
  saved: SavedMeal[];
  streak: number;
};

export async function fetchDashboard(uid: string): Promise<Dashboard> {
  const [profile, today, saved, streak] = await Promise.all([
    fetchProfile(uid),
    fetchToday(uid),
    fetchSaved(uid),
    fetchStreak(uid),
  ]);
  return { profile, today, saved, streak };
}
