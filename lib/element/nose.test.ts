import assert from "node:assert/strict";
import { test } from "node:test";
import model from "./nose-model.json" with { type: "json" };
import { inferNose, type Family } from "./nose.ts";

const families = model.families as Family[];

test("nose: fills missing families, returns a named type, flags musk-quiet only from low amber with low sensitivity", () => {
  const result = inferNose({ citrus: 5, green: 4, floral: 2 }, "medium");
  assert.deepEqual(Object.keys(result.filled), families);
  assert.equal(result.filled.citrus, 5);
  assert.equal(result.filled.green, 4);
  assert.equal(result.filled.floral, 2);
  for (const locale of ["en", "zh-Hant", "zh-Hans"] as const) {
    assert.ok(result.name[locale].length > 0);
  }
  for (const value of Object.values(result.filled)) {
    assert.ok(Number.isFinite(value) && value >= 1 && value <= 5);
  }
  assert.equal(result.muskQuiet, false);
  assert.ok(inferNose({}, "unknown").filled.citrus >= 1);
});

test("nose: uses known inputs and means for simultaneous ridge filling", () => {
  const likes = { citrus: 5, green: 4, floral: 2 };
  const result = inferNose(likes, "medium");
  const inputs = families.map((family, index) => likes[family as keyof typeof likes] ?? model.mean[index]);
  for (const family of ["water", "woody", "amber"] as const) {
    const ridge = model.ridge[family];
    const others = inputs.filter((_, index) => families[index] !== family);
    const expected = Math.min(5, Math.max(1, ridge.intercept + ridge.coef.reduce((sum, coef, index) => sum + coef * others[index], 0)));
    assert.ok(Math.abs(result.filled[family] - expected) < 1e-12);
  }
  assert.deepEqual(likes, { citrus: 5, green: 4, floral: 2 });
  const empty = inferNose({}, "unknown");
  families.forEach((family, index) => assert.ok(Math.abs(empty.filled[family] - model.mean[index]) < 1e-10));
});

test("nose: assigns each centroid to itself after reversing standardisation", () => {
  for (const centroid of model.centroids) {
    const likes = Object.fromEntries(families.map((family, index) => [family, model.mean[index] + centroid.center[index] * model.std[index]]));
    const result = inferNose(likes, "unknown");
    assert.equal(result.type, centroid.id);
    assert.deepEqual(result.name, centroid.name);
  }
});

test("nose: musk-quiet requires amber at most two and low sensitivity", () => {
  for (const sensitivity of ["high", "medium", "unknown"] as const) {
    assert.equal(inferNose({ amber: 1 }, sensitivity).muskQuiet, false);
    assert.equal(inferNose({ amber: 2 }, sensitivity).muskQuiet, false);
  }
  assert.equal(inferNose({ amber: 1 }, "low").muskQuiet, true);
  assert.equal(inferNose({ amber: 2 }, "low").muskQuiet, true);
  assert.equal(inferNose({ amber: 2.01 }, "low").muskQuiet, false);
  assert.equal(inferNose({ amber: 5 }, "low").muskQuiet, false);
});

test("nose: bounds invalid inputs and treats non-finite ratings as missing", () => {
  const result = inferNose({ citrus: 99, green: -3, water: NaN, floral: Infinity, woody: -Infinity }, "unknown");
  assert.equal(result.filled.citrus, 5);
  assert.equal(result.filled.green, 1);
  for (const value of Object.values(result.filled)) {
    assert.ok(Number.isFinite(value) && value >= 1 && value <= 5);
  }
  assert.deepEqual(result, inferNose({ citrus: 5, green: 1 }, "unknown"));
});

test("nose: exported model has finite aligned parameters and real evaluation metrics", () => {
  assert.deepEqual(families, ["citrus", "green", "water", "floral", "woody", "amber"]);
  assert.equal(new Set(model.centroids.map(({ id }) => id)).size, model.centroids.length);
  assert.ok(model.centroids.length >= 3 && model.centroids.length <= 6);
  assert.equal(model.mean.length, 6);
  assert.equal(model.std.length, 6);
  assert.ok(model.std.every((value) => Number.isFinite(value) && value > 0));
  assert.ok(model.mean.every((value) => Number.isFinite(value) && value >= 1 && value <= 5));
  for (const family of families) {
    assert.equal(model.ridge[family].coef.length, 5);
    assert.ok([model.ridge[family].intercept, ...model.ridge[family].coef].every(Number.isFinite));
  }
  assert.ok(model.centroids.every(({ center }) => center.length === 6 && center.every(Number.isFinite)));
  assert.ok(Number.isFinite(model.eval.looMae) && model.eval.looMae >= 0);
  assert.ok(Number.isFinite(model.eval.baselineMae) && model.eval.baselineMae >= 0);
});
