import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import { computeTargets, type TargetInput } from "./targets";

// Pin "now" so age (year - birthYear) is deterministic.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-18T12:00:00Z"));
});
afterAll(() => vi.useRealTimers());

const base: TargetInput = {
  sex: "male",
  birthYear: 2000, // age 26
  heightCm: 180,
  weightKg: 80,
  activity: "moderate",
  goal: "maintain",
};

describe("computeTargets", () => {
  it("computes Mifflin-St Jeor maintenance calories", () => {
    // BMR = 10*80 + 6.25*180 - 5*26 + 5 = 1800; TDEE = *1.55 = 2790 → round10 = 2790
    const t = computeTargets(base);
    expect(t.calories).toBe(2790);
  });

  it("applies the cut deficit and bulk surplus", () => {
    const lose = computeTargets({ ...base, goal: "lose" });
    const gain = computeTargets({ ...base, goal: "gain" });
    expect(lose.calories).toBeLessThan(2790);
    expect(gain.calories).toBeGreaterThan(2790);
    expect(lose.calories).toBe(Math.round((2790 * 0.85) / 10) * 10);
  });

  it("sets protein at 2 g/kg", () => {
    expect(computeTargets(base).protein).toBe(160);
  });

  it("female BMR is lower than male, same metrics", () => {
    const male = computeTargets(base);
    const female = computeTargets({ ...base, sex: "female" });
    expect(female.calories).toBeLessThan(male.calories);
  });

  it("never returns negative carbs", () => {
    const t = computeTargets({ ...base, weightKg: 200, goal: "lose" });
    expect(t.carbs).toBeGreaterThanOrEqual(0);
  });
});
