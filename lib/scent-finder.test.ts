import assert from "node:assert/strict";
import { test } from "node:test";
import { PRODUCTS } from "./shop.ts";
import { SCENT_NOTES } from "./scent-notes.ts";
import { recommendScents, SCENT_FAMILIES } from "./scent-finder.ts";

test("scent finder: fresh and warm preferences change the recommended tea and woods", () => {
  assert.equal(recommendScents("tea", 0)[0].slug, "quiet");
  assert.equal(recommendScents("tea", 4)[0].slug, "dark");
  assert.equal(recommendScents("woody", 0)[0].slug, "6am");
  assert.equal(recommendScents("woody", 4)[0].slug, "forest");
});

test("scent finder: family preference takes precedence over feel", () => {
  for (const family of ["tea", "floral", "woody"] as const) {
    for (const feel of [0, 4]) {
      assert.ok(recommendScents(family, feel).every((product) => product.families.includes(family)));
    }
  }
  assert.deepEqual(recommendScents("fruity", 4).slice(0, 2).map((product) => product.slug), ["golden", "sunday"]);
  assert.ok(recommendScents("musky", 4).every((product) => SCENT_NOTES[product.slug].en.dryDown.toLowerCase().includes("musk")));
});

test("scent finder: tied suggestions retain catalogue order without changing the catalogue", () => {
  const before = PRODUCTS.map((product) => product.slug);
  assert.deepEqual(recommendScents("any", 2).map((product) => product.slug), ["golden", "sunday", "high-tea"]);
  assert.deepEqual(PRODUCTS.map((product) => product.slug), before);
});

test("scent finder: every choice returns three unique, actual products", () => {
  for (const family of ["any", ...SCENT_FAMILIES] as const) {
    for (let feel = 0; feel <= 4; feel++) {
      const suggestions = recommendScents(family, feel);
      assert.equal(suggestions.length, 3);
      assert.equal(new Set(suggestions.map((product) => product.slug)).size, 3);
      assert.ok(suggestions.every((product) => PRODUCTS.includes(product)));
    }
  }
});
