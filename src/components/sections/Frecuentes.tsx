"use client";

import type { SavedMeal } from "@/lib/types";

type Props = {
  savedMeals: SavedMeal[];
  onAddToToday: (meal: SavedMeal) => void;
  onDelete: (id: string) => void;
};

export default function Frecuentes({ savedMeals, onAddToToday, onDelete }: Props) {
  return (
    <div className="flex flex-col pb-8">
      <header className="px-5 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            LIBRARY // 03
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)]">
            {savedMeals.length} SPECIMENS
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-[0.05em] text-[var(--fg)] mt-1 leading-none">
          FRECUENTES
        </h1>
        <div className="rule-dashed w-full mt-4" />
      </header>

      {savedMeals.length === 0 ? (
        <div className="mx-5 mt-6 border border-dashed border-[var(--rule)] py-10 px-5 text-center">
          <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">
            SIN COMIDAS GUARDADAS
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--fg-dim)] mt-2">
            Escanea algo y dale a &ldquo;guardar como frecuente&rdquo;
          </div>
        </div>
      ) : (
        <ul className="mt-6">
          {savedMeals.map((meal, idx) => (
            <li
              key={meal.id}
              className="border-t border-[var(--rule)] last:border-b"
            >
              <div className="px-5 py-4 flex items-center gap-4">
                <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-faint)] w-8 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[12px] text-[var(--fg)] truncate">
                      {meal.meal_name}
                    </span>
                    {meal.times_used > 0 && (
                      <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--fg-dim)] shrink-0">
                        ×{meal.times_used}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 mt-1 font-mono text-[9px] tracking-[0.1em] text-[var(--fg-dim)]">
                    {meal.meal_type && (
                      <span className="text-[var(--fg-faint)] tracking-[0.2em]">
                        {meal.meal_type.toUpperCase()}
                      </span>
                    )}
                    <span>{meal.calories}<span className="text-[var(--fg-faint)]">kcal</span></span>
                    <span>{meal.protein}<span className="text-[var(--fg-faint)]">P</span></span>
                    <span>{meal.carbs}<span className="text-[var(--fg-faint)]">C</span></span>
                    <span>{meal.fat}<span className="text-[var(--fg-faint)]">F</span></span>
                  </div>
                </div>
                <button
                  onClick={() => onAddToToday(meal)}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black font-mono text-[10px] tracking-[0.25em] px-3 py-2 active:scale-95 transition-transform shrink-0"
                  aria-label={`Añadir ${meal.meal_name} a hoy`}
                >
                  + HOY
                </button>
                <button
                  onClick={() => onDelete(meal.id)}
                  className="text-[var(--fg-faint)] hover:text-[var(--accent)] transition-colors font-mono text-[14px] px-1 shrink-0"
                  aria-label={`Eliminar ${meal.meal_name}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
