import assert from "node:assert/strict";
import { test } from "node:test";
import { ladderAnswerComplete, ladderComplete, pairComplete, ratingComplete, ratingsComplete } from "./completion.ts";

test("rating completion requires both deliberate ratings, including a neutral choice", () => {
  assert.equal(ratingComplete(), false);
  assert.equal(ratingComplete({ like: 3 }), false);
  assert.equal(ratingComplete({ like: 3, strength: 3 }), true);
  assert.equal(ratingComplete({ like: 0, strength: 3 }), false);
  assert.equal(ratingComplete({ like: 3, strength: NaN }), false);
  assert.equal(ratingsComplete(["A", "B"], { A: { like: 4, strength: 2 } }), false);
});

test("blank scent is a valid vial response but unanswered vials block progression", () => {
  assert.equal(ladderAnswerComplete(0), true);
  assert.equal(ladderAnswerComplete(undefined), false);
  assert.equal(ladderAnswerComplete(1.5), false);
  assert.equal(ladderComplete({ 1: 0, 2: 1, 3: 2 }), false);
  assert.equal(ladderComplete({ 1: 0, 2: 1, 3: 2, 4: 3 }), true);
  assert.equal(ladderComplete({ 1: 0, 2: 1, 3: 2, 4: 4 }), false);
});

test("the final comparison requires two distinct real bases", () => {
  assert.equal(pairComplete(["A"]), false);
  assert.equal(pairComplete(["A", "A"]), false);
  assert.equal(pairComplete(["A", "G"]), false);
  assert.equal(pairComplete(["B", "F"]), true);
});
