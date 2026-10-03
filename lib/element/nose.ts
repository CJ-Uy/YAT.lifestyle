import model from "./nose-model.json" with { type: "json" };

import type { Family, Localised } from "./types.ts";
export type { Family, Localised };

const families = model.families as Family[];
const clamp = (value: number): number => Math.min(5, Math.max(1, value));

export function inferNose(
  likes: Partial<Record<Family, number>>,
  sensitivity: "high" | "medium" | "low" | "unknown",
): { type: string; name: Localised; filled: Record<Family, number>; muskQuiet: boolean } {
  const known = families.map((family) => {
    const value = likes[family];
    return typeof value === "number" && Number.isFinite(value) ? clamp(value) : undefined;
  });
  const inputs = known.map((value, index) => value ?? model.mean[index]);
  const filled = {} as Record<Family, number>;

  families.forEach((family, index) => {
    const ridge = model.ridge[family];
    // Coefficients follow model.families with the target family omitted.
    // All predictions use the same inputs, never an earlier imputed output.
    const others = inputs.filter((_, inputIndex) => inputIndex !== index);
    const predicted = ridge.intercept + ridge.coef.reduce((sum, coef, inputIndex) => sum + coef * others[inputIndex], 0);
    filled[family] = known[index] ?? clamp(predicted);
  });

  const standardised = families.map((family, index) => (filled[family] - model.mean[index]) / model.std[index]);
  let nearest = model.centroids[0];
  let distance = Infinity;
  for (const centroid of model.centroids) {
    const candidate = centroid.center.reduce((sum, value, index) => sum + (standardised[index] - value) ** 2, 0);
    if (candidate < distance) {
      nearest = centroid;
      distance = candidate;
    }
  }

  return {
    type: nearest.id,
    name: { ...nearest.name },
    filled,
    muskQuiet: filled.amber <= 2 && sensitivity === "low",
  };
}
