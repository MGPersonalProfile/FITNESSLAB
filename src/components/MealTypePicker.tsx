"use client";

import { MEAL_TYPES, type MealType } from "@/lib/types";

type Props = {
  value: MealType | null;
  onChange: (m: MealType) => void;
};

export default function MealTypePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-px bg-[var(--rule)] border border-[var(--rule)]">
      {MEAL_TYPES.map((m) => {
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`py-3 font-mono text-[9px] tracking-[0.25em] transition-colors ${
              active
                ? "bg-[var(--accent)] text-black"
                : "bg-[var(--bg)] text-[var(--fg-dim)] hover:text-[var(--fg)] active:bg-[var(--bg-elev)]"
            }`}
          >
            {m.slice(0, 4).toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
