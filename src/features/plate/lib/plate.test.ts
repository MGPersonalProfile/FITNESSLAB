import { describe, expect, it } from "vitest";
import { evaluatePlate, scorePlate, verdictFor } from "./plate";
import type { PlateAnalysis } from "@/shared/types";

const make = (v: number, c: number, p: number, o: number): PlateAnalysis => ({
  verduras_frutas_pct: v,
  cereales_pct: c,
  proteina_pct: p,
  otros_pct: o,
  detectado: [],
  recomendacion: "",
});

describe("scorePlate", () => {
  it("scores a perfect Harvard plate 100", () => {
    expect(scorePlate(make(50, 25, 25, 0))).toBe(100);
  });

  it("scores an all-junk plate 0", () => {
    expect(scorePlate(make(0, 0, 0, 100))).toBe(0);
  });

  it("penalizes deviation proportionally", () => {
    // |60-50|+|20-25|+|20-25|+|0-0| = 20 → 100 - 10 = 90
    expect(scorePlate(make(60, 20, 20, 0))).toBe(90);
  });

  it("clamps to the 0-100 range", () => {
    const s = scorePlate(make(100, 0, 0, 0));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("verdictFor", () => {
  it("maps score bands to verdicts", () => {
    expect(verdictFor(95)).toBe("Balanceado");
    expect(verdictFor(80)).toBe("Balanceado");
    expect(verdictFor(79)).toBe("Mejorable");
    expect(verdictFor(50)).toBe("Mejorable");
    expect(verdictFor(49)).toBe("Desbalanceado");
  });
});

describe("evaluatePlate", () => {
  it("combines proportions with computed score and verdict", () => {
    const ev = evaluatePlate(make(50, 25, 25, 0));
    expect(ev.score).toBe(100);
    expect(ev.veredicto).toBe("Balanceado");
    expect(ev.verduras_frutas_pct).toBe(50);
  });
});
