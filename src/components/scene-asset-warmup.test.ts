import { describe, expect, it } from "vitest";

import { getSceneWarmupDelay } from "./scene-asset-warmup";

describe("scene asset warmup policy", () => {
  it("waits longer on data-saving or very slow connections", () => {
    expect(getSceneWarmupDelay({ saveData: true })).toBe(4200);
    expect(getSceneWarmupDelay({ effectiveType: "2g" })).toBe(4200);
  });

  it("starts background warming after the hero window on normal connections", () => {
    expect(getSceneWarmupDelay({ effectiveType: "4g" })).toBe(1800);
    expect(getSceneWarmupDelay()).toBe(1800);
  });
});

