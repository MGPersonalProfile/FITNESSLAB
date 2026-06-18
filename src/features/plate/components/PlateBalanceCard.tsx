"use client";

import type { PlateEval } from "@/shared/types";
import { plateColor } from "@/features/plate/lib/plate";
import { t } from "@/shared/i18n";

const GROUPS = [
  { key: "verduras_frutas_pct", label: "VERD/FRUTA", target: 50, color: "var(--success)" },
  { key: "cereales_pct", label: "CEREALES", target: 25, color: "var(--warning)" },
  { key: "proteina_pct", label: "PROTEÍNA", target: 25, color: "var(--accent)" },
  { key: "otros_pct", label: "OTROS", target: 0, color: "var(--fg-faint)" },
] as const;

export default function PlateBalanceCard({ data }: { data: PlateEval }) {
  const color = plateColor(data.score);
  return (
    <div className="border border-[var(--rule)]">
      {/* Header: score + verdict */}
      <div className="flex items-stretch border-b border-[var(--rule)]">
        <div className="flex flex-col justify-center px-4 py-3 border-r border-[var(--rule)] min-w-[92px]">
          <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)]">
            PLATO // HARVARD
          </div>
          <div className="font-display text-3xl leading-none mt-1" style={{ color }}>
            {data.score}
            <span className="font-mono text-[10px] text-[var(--fg-faint)] ml-1">/100</span>
          </div>
        </div>
        <div className="flex-1 flex items-center px-4">
          <span
            className="font-mono text-[11px] tracking-[0.25em]"
            style={{ color }}
          >
            {data.veredicto.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Proportion bar */}
      <div className="px-4 pt-4">
        <div className="flex h-3 w-full overflow-hidden border border-[var(--rule)]">
          {GROUPS.map((g) => {
            const pct = data[g.key];
            if (pct <= 0) return null;
            return (
              <div
                key={g.key}
                style={{ width: `${pct}%`, backgroundColor: g.color }}
                title={`${g.label}: ${pct}%`}
              />
            );
          })}
        </div>
        {/* Target reference: ½ veg · ¼ cereal · ¼ proteína */}
        <div className="font-mono text-[8px] tracking-[0.2em] text-[var(--fg-faint)] mt-1.5">
          {t.plate.target}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-4">
        {GROUPS.map((g) => (
          <div key={g.key} className="flex items-center gap-2">
            <span className="w-2 h-2 shrink-0" style={{ backgroundColor: g.color }} />
            <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--fg-dim)] flex-1">
              {g.label}
            </span>
            <span className="font-mono text-[11px] text-[var(--fg)]">{data[g.key]}%</span>
          </div>
        ))}
      </div>

      {/* Detected components */}
      {data.detectado.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {data.detectado.map((d, i) => (
            <span
              key={i}
              className="font-mono text-[9px] tracking-[0.1em] text-[var(--fg-dim)] border border-[var(--rule)] px-2 py-1"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Recommendation */}
      {data.recomendacion && (
        <div className="border-t border-[var(--rule)] px-4 py-3 bg-[var(--bg-elev)]">
          <div className="font-mono text-[8px] tracking-[0.3em] text-[var(--fg-faint)] mb-1">
            {t.plate.recommendation}
          </div>
          <div className="font-mono text-[11px] leading-relaxed text-[var(--fg-dim)]">
            {data.recomendacion}
          </div>
        </div>
      )}
    </div>
  );
}
