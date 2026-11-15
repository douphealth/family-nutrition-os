import { describe, expect, it } from "vitest";
import { FAMILY, PLAN_28, RECIPES } from "@/engine/data";
import { cycleDayIndex } from "@/engine/dates";
import { targetsFor } from "@/engine/nutrition-engine";

describe("nutrition engine carried over from the original app", () => {
  it("keeps the 28-day rotation and 28 recipes", () => {
    expect(PLAN_28).toHaveLength(28);
    expect(RECIPES.length).toBeGreaterThanOrEqual(28);
  });
  it("starts the rotation on a Monday (2024-01-01 is day 1)", () => {
    expect(cycleDayIndex("2024-01-01")).toBe(1);
    expect(cycleDayIndex("2024-01-29")).toBe(1);
  });
  it("never gives a minor a calorie-restriction note-free deficit target", () => {
    const son = FAMILY.find((p: any) => p.id === "son");
    expect(targetsFor(son).energy.note).toMatch(/ποτέ στόχος περιορισμού/);
  });
});
