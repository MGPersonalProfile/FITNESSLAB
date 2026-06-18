import { supabase } from "@/shared/lib/supabaseClient";
import { todayMadrid } from "@/shared/lib/dates";
import type { Challenge, ChallengeMetric, ChallengeProgress } from "@/shared/types";

export async function fetchActiveChallenges(): Promise<Challenge[]> {
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .gte("ends_on", todayMadrid())
    .order("created_at", { ascending: false });
  return (data as Challenge[]) ?? [];
}

export async function fetchMyChallengeIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", userId);
  return new Set(((data as { challenge_id: string }[]) ?? []).map((r) => r.challenge_id));
}

export async function fetchChallengeProgress(cid: string): Promise<ChallengeProgress[]> {
  const { data } = await supabase.rpc("get_challenge_progress", { cid });
  return ((data as ChallengeProgress[]) ?? []).sort((a, b) => b.value - a.value);
}

export async function createChallenge(
  creator: string,
  title: string,
  metric: ChallengeMetric,
  target: number,
  days: number,
): Promise<void> {
  const starts = todayMadrid();
  const ends = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("challenges")
    .insert({ creator, title, metric, target, starts_on: starts, ends_on: ends })
    .select("id")
    .single();
  const cid = (data as { id: string } | null)?.id;
  if (cid) await joinChallenge(cid, creator);
}

export async function joinChallenge(cid: string, userId: string): Promise<void> {
  await supabase.from("challenge_participants").insert({ challenge_id: cid, user_id: userId });
}

export async function leaveChallenge(cid: string, userId: string): Promise<void> {
  await supabase
    .from("challenge_participants")
    .delete()
    .eq("challenge_id", cid)
    .eq("user_id", userId);
}
