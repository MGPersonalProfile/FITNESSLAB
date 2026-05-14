"use client";

import { motion } from "framer-motion";

type Props = {
  value: number;
  target: number;
  label: string;
  unit: string;
  size?: number;
  stroke?: number;
};

export default function MacroRing({
  value,
  target,
  label,
  unit,
  size = 100,
  stroke = 5,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? value / target : 0;
  const clamped = Math.max(0, Math.min(1.5, ratio));
  const isOver = ratio > 1;
  const dashOffset = circumference * (1 - Math.min(1, clamped));

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--bg-elev-2)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? "var(--warning)" : "var(--accent)"}
          strokeWidth={stroke}
          strokeLinecap="butt"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Tick at top (0/100%) */}
        <line
          x1={size / 2}
          y1={stroke / 2 - 2}
          x2={size / 2}
          y2={stroke + 3}
          stroke="var(--fg-faint)"
          strokeWidth={1}
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center leading-none">
        <span className="font-display text-[clamp(1.5rem,7vw,2rem)] text-[var(--fg)]">
          {Math.round(value)}
        </span>
        <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--fg-dim)] mt-1">
          {unit}
        </span>
        <span className="font-mono text-[7px] tracking-[0.25em] text-[var(--fg-faint)] mt-1">
          /{target}
        </span>
      </div>

      {/* Label outside the ring */}
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.3em] text-[var(--fg-dim)]">
        {label}
      </span>
    </div>
  );
}
