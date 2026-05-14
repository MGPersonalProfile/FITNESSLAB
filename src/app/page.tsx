"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabaseClient";
import type { FoodLog, Profile, SavedMeal } from "@/lib/types";
import { todayMadrid } from "@/lib/dates";

import BottomNav, { type Tab } from "@/components/BottomNav";
import Hoy from "@/components/sections/Hoy";
import Historial from "@/components/sections/Historial";
import Frecuentes from "@/components/sections/Frecuentes";
import Perfil from "@/components/sections/Perfil";
import ScanModal from "@/components/ScanModal";
import LogFormModal from "@/components/LogFormModal";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [streak, setStreak] = useState(0);

  const [tab, setTab] = useState<Tab>("hoy");

  const [scanOpen, setScanOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FoodLog | null>(null);

  // ===== Auth bootstrap =====
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        router.replace("/login");
      } else {
        setSession(data.session);
      }
      setBootstrapped(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (!s) router.replace("/login");
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // ===== Data loaders =====
  const userId = session?.user.id ?? null;

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  const loadToday = useCallback(async (uid: string) => {
    const today = todayMadrid();
    const { data } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", uid)
      .eq("log_date", today)
      .order("created_at", { ascending: true });
    setTodayLogs((data as FoodLog[]) ?? []);
  }, []);

  const loadSaved = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("saved_meals")
      .select("*")
      .eq("user_id", uid)
      .order("times_used", { ascending: false })
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    setSavedMeals((data as SavedMeal[]) ?? []);
  }, []);

  const loadStreak = useCallback(async (uid: string) => {
    const { data } = await supabase.rpc("get_user_streak", { user_uuid: uid });
    if (typeof data === "number") setStreak(data);
  }, []);

  const refreshAll = useCallback(async () => {
    if (!userId) return;
    await Promise.all([
      loadProfile(userId),
      loadToday(userId),
      loadSaved(userId),
      loadStreak(userId),
    ]);
  }, [userId, loadProfile, loadToday, loadSaved, loadStreak]);

  useEffect(() => {
    if (userId) void refreshAll();
  }, [userId, refreshAll]);

  // ===== Actions =====
  const handleDeleteLog = async (id: string) => {
    const prev = todayLogs;
    setTodayLogs((logs) => logs.filter((l) => l.id !== id));
    const { error } = await supabase.from("food_logs").delete().eq("id", id);
    if (error) {
      console.error(error);
      setTodayLogs(prev);
    }
  };

  const handleAddSaved = async (meal: SavedMeal) => {
    if (!userId) return;
    await supabase.from("food_logs").insert({
      user_id: userId,
      food_name: meal.meal_name,
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs,
      fiber: meal.fiber,
      sugar: meal.sugar,
      meal_type: meal.meal_type,
      is_ai_estimated: false,
      log_date: todayMadrid(),
    });
    await supabase.rpc("use_saved_meal", { meal_id: meal.id });
    await Promise.all([userId ? loadToday(userId) : null, userId ? loadSaved(userId) : null]);
    setTab("hoy");
  };

  const handleDeleteSaved = async (id: string) => {
    setSavedMeals((s) => s.filter((m) => m.id !== id));
    await supabase.from("saved_meals").delete().eq("id", id);
  };

  const handleProfileUpdate = async (next: Partial<Profile>) => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .update(next)
      .eq("id", userId)
      .select()
      .single();
    if (data) setProfile(data as Profile);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // ===== Render =====
  if (!bootstrapped || !session || !userId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)] animate-blink">
          INICIANDO...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)] pb-14">
      {/* Top brand bar — minimal, lab letterhead */}
      <div className="flex items-center justify-between px-5 pt-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-base tracking-[0.15em] text-[var(--accent)] leading-none">
            FITNESS
          </span>
          <span className="font-display text-base tracking-[0.15em] text-[var(--fg)] leading-none">
            LAB
          </span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.3em] text-[var(--fg-faint)]">
          REPORT · v1.0
        </span>
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex-1"
        >
          {tab === "hoy" && (
            <Hoy
              profile={profile}
              todayLogs={todayLogs}
              streak={streak}
              onScan={() => setScanOpen(true)}
              onManualLog={() => setManualOpen(true)}
              onEditLog={(l) => setEditTarget(l)}
              onDeleteLog={handleDeleteLog}
            />
          )}
          {tab === "historial" && (
            <Historial userId={userId} profile={profile} />
          )}
          {tab === "frecuentes" && (
            <Frecuentes
              savedMeals={savedMeals}
              onAddToToday={handleAddSaved}
              onDelete={handleDeleteSaved}
            />
          )}
          {tab === "perfil" && (
            <Perfil
              userId={userId}
              email={session.user.email ?? null}
              profile={profile}
              onProfileUpdate={handleProfileUpdate}
              onSignOut={handleSignOut}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav active={tab} onChange={setTab} />

      {/* Modals */}
      <ScanModal
        open={scanOpen}
        userId={userId}
        onClose={() => setScanOpen(false)}
        onDone={async () => {
          if (userId) await Promise.all([loadToday(userId), loadStreak(userId)]);
        }}
      />
      <LogFormModal
        open={manualOpen}
        mode="manual"
        userId={userId}
        onClose={() => setManualOpen(false)}
        onDone={async () => {
          if (userId) await loadToday(userId);
        }}
      />
      <LogFormModal
        open={!!editTarget}
        mode="edit"
        userId={userId}
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onDone={async () => {
          if (userId) await loadToday(userId);
        }}
      />
    </main>
  );
}
