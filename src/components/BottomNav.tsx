"use client";

import { motion } from "framer-motion";

export type Tab = "hoy" | "historial" | "frecuentes" | "perfil";

const ITEMS: { id: Tab; label: string; code: string }[] = [
  { id: "hoy",        label: "HOY",        code: "01" },
  { id: "historial",  label: "HISTORIAL",  code: "02" },
  { id: "frecuentes", label: "FRECUENTES", code: "03" },
  { id: "perfil",     label: "PERFIL",     code: "04" },
];

type Props = {
  active: Tab;
  onChange: (t: Tab) => void;
};

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--rule)] bg-[var(--bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4 relative">
        {ITEMS.map((it) => {
          const isActive = active === it.id;
          return (
            <li key={it.id} className="relative">
              <button
                onClick={() => onChange(it.id)}
                className="group w-full h-14 flex flex-col items-center justify-center gap-1 select-none"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`font-mono text-[9px] tracking-[0.25em] transition-colors ${
                    isActive ? "text-[var(--accent)]" : "text-[var(--fg-faint)] group-active:text-[var(--fg-dim)]"
                  }`}
                >
                  {it.code}
                </span>
                <span
                  className={`font-mono text-[10px] tracking-[0.2em] transition-colors ${
                    isActive ? "text-[var(--fg)]" : "text-[var(--fg-dim)] group-active:text-[var(--fg)]"
                  }`}
                >
                  {it.label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute top-0 left-3 right-3 h-[2px] bg-[var(--accent)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
