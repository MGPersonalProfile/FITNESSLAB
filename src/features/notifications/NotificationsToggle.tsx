"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/shared/lib/authedFetch";
import { track } from "@/shared/lib/analytics";

type State = "checking" | "unsupported" | "default" | "denied" | "enabled" | "working";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function NotificationsToggle() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    // Detect support/permission after mount (setState in a microtask callback,
    // not synchronously) — also avoids any SSR/client hydration mismatch.
    Promise.resolve().then(() => {
      if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        setState("unsupported");
      } else if (Notification.permission === "denied") {
        setState("denied");
      } else if (Notification.permission === "granted") {
        setState("enabled");
      } else {
        setState("default");
      }
    });
  }, []);

  const enable = async () => {
    setState("working");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "default");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setState("unsupported");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
      });
      const res = await authedFetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (res.ok) {
        track("push_enabled");
        setState("enabled");
      } else {
        setState("default");
      }
    } catch (err) {
      console.error("push enable failed:", err);
      setState("default");
    }
  };

  if (state === "checking" || state === "unsupported") return null;

  return (
    <section className="px-5 mt-8">
      <div className="font-mono text-[9px] tracking-[0.3em] text-[var(--fg-faint)] mb-2">
        NOTIFICACIONES
      </div>
      {state === "enabled" ? (
        <div className="border border-[var(--rule)] py-3 text-center font-mono text-[10px] tracking-[0.25em] text-[var(--success)]">
          ◆ ACTIVADAS
        </div>
      ) : state === "denied" ? (
        <div className="border border-[var(--rule)] py-3 text-center font-mono text-[9px] tracking-[0.2em] text-[var(--fg-faint)]">
          BLOQUEADAS — ACTÍVALAS EN LOS AJUSTES DEL NAVEGADOR
        </div>
      ) : (
        <button
          onClick={enable}
          disabled={state === "working"}
          className="w-full border border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--fg-dim)] font-mono text-[10px] tracking-[0.3em] py-3 transition-colors active:scale-[0.99] disabled:opacity-50"
        >
          {state === "working" ? "ACTIVANDO..." : "ACTIVAR RECORDATORIOS"}
        </button>
      )}
    </section>
  );
}
