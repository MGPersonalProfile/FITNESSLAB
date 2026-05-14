"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, WeightLog } from "@/lib/types";
import { formatRelativeDay, todayMadrid } from "@/lib/dates";

type Props = {
  userId: string;
  email: string | null;
  profile: Profile | null;
  onProfileUpdate: (next: Partial<Profile>) => Promise<void>;
  onSignOut: () => void;
};

export default function Perfil({
  userId,
  email,
  profile,
  onProfileUpdate,
  onSignOut,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [targets, setTargets] = useState({
    cal: profile?.target_calories ?? 2000,
    prot: profile?.target_protein ?? 150,
    carbs: profile?.target_carbs ?? 200,
    fat: profile?.target_fat ?? 65,
  });
  const [saving, setSaving] = useState(false);

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState<string>("");
  const [weightSaving, setWeightSaving] = useState(false);

  useEffect(() => {
    setTargets({
      cal: profile?.target_calories ?? 2000,
      prot: profile?.target_protein ?? 150,
      carbs: profile?.target_carbs ?? 200,
      fat: profile?.target_fat ?? 65,
    });
  }, [profile]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(30);
      if (mounted) setWeightLogs((data as WeightLog[]) ?? []);
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const saveTargets = async () => {
    setSaving(true);
    await onProfileUpdate({
      target_calories: targets.cal,
      target_protein: targets.prot,
      target_carbs: targets.carbs,
      target_fat: targets.fat,
    });
    setEditing(false);
    setSaving(false);
  };

  const addWeight = async () => {
    const w = parseFloat(newWeight.replace(",", "."));
    if (!isFinite(w) || w <= 0) return;
    setWeightSaving(true);
    const { data, error } = await supabase
      .from("weight_logs")
      .insert({ user_id: userId, weight_kg: w, log_date: todayMadrid() })
      .select()
      .single();
    if (!error && data) {
      setWeightLogs((prev) => [data as WeightLog, ...prev]);
      await onProfileUpdate({ weight_kg: w });
      setNewWeight("");
    }
    setWeightSaving(false);
  };

  const latestWeight = weightLogs[0]?.weight_kg ?? profile?.weight_kg ?? null;

  // sparkline data (oldest → newest, last 30 entries)
  const sparkData = [...weightLogs].reverse();
  const minW = sparkData.length ? Math.min(...sparkData.map((w) => w.weight_kg)) : 0;
  const maxW = sparkData.length ? Math.max(...sparkData.map((w) => w.weight_kg)) : 1;
  const range = Math.max(0.5, maxW - minW);

  return (
    <div className="flex flex-col pb-8">
      {/* HEADER */}
      <header className="px-5 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            PROFILE // 04
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)]">
            ID · {userId.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-[0.05em] text-[var(--fg)] mt-1 leading-none">
          {profile?.display_name?.toUpperCase() ?? "PERFIL"}
        </h1>
        <div className="rule-dashed w-full mt-4" />
      </header>

      {/* IDENTITY */}
      <section className="px-5 mt-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 border border-[var(--rule)] bg-[var(--bg-elev)] overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-2xl text-[var(--fg-faint)]">
                {(profile?.display_name ?? email ?? "?")[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] tracking-[0.25em] text-[var(--fg-faint)]">
              EMAIL
            </div>
            <div className="font-mono text-[12px] text-[var(--fg)] truncate">
              {email ?? "—"}
            </div>
          </div>
        </div>
      </section>

      {/* TARGETS */}
      <section className="px-5 mt-8">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            TARGETS // DAILY
          </span>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="font-mono text-[10px] tracking-[0.25em] text-[var(--accent)] hover:underline"
            >
              EDIT
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="font-mono text-[10px] tracking-[0.25em] text-[var(--fg-faint)]"
            >
              CANCEL
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px bg-[var(--rule)] border border-[var(--rule)]">
          <TargetCell
            label="CAL"
            unit="kcal"
            value={targets.cal}
            editing={editing}
            onChange={(v) => setTargets((s) => ({ ...s, cal: v }))}
          />
          <TargetCell
            label="PROT"
            unit="g"
            value={targets.prot}
            editing={editing}
            onChange={(v) => setTargets((s) => ({ ...s, prot: v }))}
          />
          <TargetCell
            label="CARB"
            unit="g"
            value={targets.carbs}
            editing={editing}
            onChange={(v) => setTargets((s) => ({ ...s, carbs: v }))}
          />
          <TargetCell
            label="FAT"
            unit="g"
            value={targets.fat}
            editing={editing}
            onChange={(v) => setTargets((s) => ({ ...s, fat: v }))}
          />
        </div>

        {editing && (
          <button
            onClick={saveTargets}
            disabled={saving}
            className="w-full mt-3 bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-black font-mono text-[11px] tracking-[0.3em] py-3 active:scale-[0.99] transition-transform"
          >
            {saving ? "SAVING..." : "GUARDAR TARGETS"}
          </button>
        )}
      </section>

      {/* WEIGHT */}
      <section className="px-5 mt-8">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            WEIGHT // LOG
          </span>
          <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--fg-dim)]">
            {latestWeight !== null ? `${latestWeight} kg` : "—"}
          </span>
        </div>

        {/* Sparkline */}
        <div className="border border-[var(--rule)] p-4">
          {sparkData.length >= 2 ? (
            <svg
              viewBox="0 0 200 60"
              className="w-full h-16"
              preserveAspectRatio="none"
            >
              {/* horizontal mid line */}
              <line
                x1="0"
                y1="30"
                x2="200"
                y2="30"
                stroke="var(--rule)"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
              <polyline
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                points={sparkData
                  .map((w, i) => {
                    const x = (i / (sparkData.length - 1)) * 200;
                    const y = 56 - ((w.weight_kg - minW) / range) * 48;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
              {sparkData.map((w, i) => {
                const x = (i / (sparkData.length - 1)) * 200;
                const y = 56 - ((w.weight_kg - minW) / range) * 48;
                return (
                  <circle
                    key={w.id}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="var(--accent)"
                  />
                );
              })}
            </svg>
          ) : (
            <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--fg-faint)] text-center py-6">
              ADD MORE READINGS TO PLOT
            </div>
          )}

          <div className="flex items-center justify-between mt-3 font-mono text-[9px] tracking-[0.2em] text-[var(--fg-faint)]">
            <span>{sparkData[0] ? formatRelativeDay(sparkData[0].log_date) : "—"}</span>
            <span>
              MIN {sparkData.length ? minW : "—"} · MAX {sparkData.length ? maxW : "—"}
            </span>
            <span>{sparkData.at(-1) ? formatRelativeDay(sparkData.at(-1)!.log_date) : "—"}</span>
          </div>
        </div>

        <div className="flex items-stretch gap-2 mt-3">
          <input
            inputMode="decimal"
            placeholder="kg"
            value={newWeight}
            onChange={(e) =>
              setNewWeight(e.target.value.replace(/[^0-9.,]/g, ""))
            }
            className="flex-1 bg-[var(--bg-elev)] border border-[var(--rule)] focus:border-[var(--accent)] outline-none px-4 py-3 font-mono text-[14px] text-[var(--fg)] tracking-[0.1em]"
          />
          <button
            onClick={addWeight}
            disabled={weightSaving || !newWeight}
            className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-black font-mono text-[10px] tracking-[0.3em] px-5 active:scale-95 transition-transform"
          >
            {weightSaving ? "..." : "+ LOG"}
          </button>
        </div>
      </section>

      {/* ACCOUNT */}
      <section className="px-5 mt-10">
        <div className="rule-dashed w-full mb-4" />
        <button
          onClick={onSignOut}
          className="w-full border border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--fg-dim)] font-mono text-[11px] tracking-[0.3em] py-4 transition-colors active:scale-[0.99]"
        >
          CERRAR SESIÓN
        </button>
        <div className="font-mono text-[8px] tracking-[0.3em] text-[var(--fg-faint)] text-center mt-4">
          FITNESSLAB · v1.0 · BUILT FOR THE CREW
        </div>
      </section>
    </div>
  );
}

function TargetCell({
  label,
  unit,
  value,
  editing,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  editing: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-[var(--bg)] p-4">
      <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">
        {label}
      </div>
      {editing ? (
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
          className="w-full bg-transparent border-b border-[var(--fg-faint)] focus:border-[var(--accent)] outline-none font-display text-3xl text-[var(--fg)] mt-1"
        />
      ) : (
        <div className="font-display text-3xl text-[var(--fg)] mt-1 leading-none">
          {value}
        </div>
      )}
      <div className="font-mono text-[8px] tracking-[0.25em] text-[var(--fg-faint)] mt-1">
        {unit}/day
      </div>
    </div>
  );
}
