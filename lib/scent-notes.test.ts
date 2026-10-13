import assert from "node:assert/strict";
import { test } from "node:test";
import { SCENT_NOTES, SCENT_STAGES, scentJourneyCopy } from "./scent-notes.ts";
import { PRODUCTS } from "./shop.ts";

test("scent journeys: all twelve products have three localized stages and visible draft context", () => {
  assert.deepEqual(Object.keys(SCENT_NOTES).sort(), PRODUCTS.map((product) => product.slug).sort());
  assert.deepEqual(SCENT_STAGES, ["opening", "heart", "dryDown"]);
  assert.deepEqual(scentJourneyCopy.en.labels, { opening: "Top notes", heart: "Middle notes", dryDown: "Base notes" });
  for (const product of PRODUCTS) {
    const notes = SCENT_NOTES[product.slug];
    assert.deepEqual(Object.keys(notes).sort(), Object.keys(product.copy).sort());
    for (const locale of Object.keys(product.copy) as (keyof typeof product.copy)[]) {
      assert.deepEqual(Object.keys(notes[locale]).sort(), [...SCENT_STAGES].sort());
      const context = scentJourneyCopy[locale];
      assert.match(context.title, /draft|草稿/);
      assert.match(context.disclaimer, /inferred|推測|推测/);
      for (const stage of SCENT_STAGES) {
        assert.ok(context.labels[stage].trim());
        assert.ok(notes[locale][stage].trim());
        assert.doesNotMatch(notes[locale][stage], /\d+\s*(?:%|minutes?|hours?)|\d+\s*(?:小時|小时|分鐘|分钟)/i);
        if (locale !== "en") assert.match(notes[locale][stage], /\p{Script=Han}/u);
      }
    }
  }
  assert.match(SCENT_NOTES.white.en.heart, /Lily of the valley/);
  assert.match(SCENT_NOTES.white["zh-Hant"].heart, /鈴蘭/);
  assert.match(SCENT_NOTES.ocean.en.heart, /Sea salt/);
});
