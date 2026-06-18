"use client";

import { useCallback, useState } from "react";
import { processImage } from "@/shared/lib/image";
import { authedFetch } from "@/shared/lib/authedFetch";
import { t } from "@/shared/i18n";
import type { AnalysisResult } from "@/shared/types";

export type AnalysisStatus = "idle" | "analyzing" | "done" | "error";

type AnalyzeOk = { data: AnalysisResult; durationMs: number };

// Shared capture → process → /api/analyze pipeline used by both the
// macro-logging scan flow and the standalone plate validation flow.
export function useDishAnalysis() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File): Promise<AnalyzeOk | null> => {
    setStatus("analyzing");
    setError(null);
    const t0 = performance.now();
    try {
      const { base64, blob } = await processImage(file);
      setPreview(base64);
      setImageBlob(blob);

      const res = await authedFetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) {
        // Surface server-provided messages (401 sesión, 429 cuota) when present.
        let msg = t.scan.analyzeFailed;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        setStatus("error");
        setError(msg);
        return null;
      }

      const data: AnalysisResult = await res.json();
      const durationMs = Math.round(performance.now() - t0);
      setResult(data);
      setStatus("done");
      return { data, durationMs };
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(t.scan.analyzeFailed);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setPreview(null);
    setImageBlob(null);
    setResult(null);
    setError(null);
  }, []);

  return { status, preview, imageBlob, result, error, analyze, reset };
}
