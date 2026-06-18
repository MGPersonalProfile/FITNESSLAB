"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { track } from "@/shared/lib/analytics";
import type { Friend, FriendRequest } from "@/shared/types";
import Leaderboard from "@/features/social/components/Leaderboard";
import {
  fetchFriends,
  fetchPendingRequests,
  removeFriend,
  respondRequest,
  sendFriendRequest,
  type RequestResult,
} from "@/features/social/data";

const RESULT_MSG: Record<RequestResult, string> = {
  ok: "Solicitud enviada.",
  not_found: "No hay ningún usuario con ese email.",
  self: "Ese eres tú.",
  exists: "Ya tienes relación con ese usuario.",
  error: "No se pudo enviar. Reintenta.",
};

export default function Social({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [f, p] = await Promise.all([fetchFriends(), fetchPendingRequests()]);
    setFriends(f);
    setPending(p);
  }, []);

  useEffect(() => {
    // setState only inside the resolved callback (not synchronously here).
    Promise.all([fetchFriends(), fetchPendingRequests()]).then(([f, p]) => {
      setFriends(f);
      setPending(p);
    });
  }, []);

  const send = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    const res = await sendFriendRequest(email.trim());
    setMsg(RESULT_MSG[res]);
    if (res === "ok") {
      setEmail("");
      track("friend_request_sent");
    }
    setBusy(false);
  };

  const respond = async (id: string, accept: boolean) => {
    await respondRequest(id, accept);
    track(accept ? "friend_request_accepted" : "friend_request_rejected");
    await reload();
  };

  const unfriend = async (fid: string) => {
    if (!window.confirm("¿Eliminar a este amigo?")) return;
    await removeFriend(userId, fid);
    await reload();
  };

  return (
    <div className="flex flex-col pb-8">
      <header className="px-5 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)]">UNIT // 04</span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)]">
            {friends.length} ALIADOS
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-[0.05em] text-[var(--fg)] mt-1 leading-none">SOCIAL</h1>
        <div className="rule-dashed w-full mt-4" />
      </header>

      {/* Add by email */}
      <section className="px-5 mt-6">
        <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">AÑADIR POR EMAIL</div>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="amigo@email.com"
            className="flex-1 bg-[var(--bg-elev)] border border-[var(--rule)] focus:border-[var(--accent)] outline-none font-mono text-[12px] text-[var(--fg)] py-3 px-3 placeholder:text-[var(--fg-faint)]"
          />
          <button
            onClick={send}
            disabled={busy}
            className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-black font-mono text-[10px] tracking-[0.25em] px-4 active:scale-[0.99] transition-transform"
          >
            ENVIAR
          </button>
        </div>
        {msg && <div className="font-mono text-[10px] tracking-[0.15em] text-[var(--fg-dim)] mt-2">{msg}</div>}
      </section>

      {/* Leaderboard */}
      <Leaderboard userId={userId} />

      {/* Pending requests */}
      {pending.length > 0 && (
        <section className="px-5 mt-8">
          <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">SOLICITUDES</div>
          <div className="flex flex-col">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border-t border-[var(--rule)] last:border-b py-3">
                <span className="font-mono text-[12px] text-[var(--fg)] flex-1 truncate">
                  {r.display_name ?? "Anónimo"}
                </span>
                <button
                  onClick={() => respond(r.id, true)}
                  className="font-mono text-[10px] tracking-[0.2em] text-[var(--success)] hover:opacity-70"
                >
                  ACEPTAR
                </button>
                <button
                  onClick={() => respond(r.id, false)}
                  className="font-mono text-[10px] tracking-[0.2em] text-[var(--fg-faint)] hover:text-[var(--accent)]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section className="px-5 mt-8">
        <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">ALIADOS</div>
        {friends.length === 0 ? (
          <div className="border border-dashed border-[var(--rule)] py-8 px-5 text-center font-mono text-[10px] tracking-[0.2em] text-[var(--fg-faint)]">
            AÚN SIN ALIADOS
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            {friends.map((f) => (
              <div key={f.id} className="group flex items-center gap-3 border-t border-[var(--rule)] last:border-b py-3">
                <span className="font-mono text-[12px] text-[var(--fg)] flex-1 truncate">
                  {f.display_name ?? "Anónimo"}
                </span>
                <button
                  onClick={() => unfriend(f.id)}
                  className="font-mono text-[10px] text-[var(--fg-faint)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar amigo"
                >
                  ×
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
