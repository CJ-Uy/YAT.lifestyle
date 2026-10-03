import assert from "node:assert/strict";
import { test } from "node:test";
import { journeyMotion, journeyProgress } from "./journey-motion.ts";

test("scroll progress clamps endpoints and keeps invalid layouts at the opening", () => {
  assert.equal(journeyProgress(80, 2000), 0);
  assert.equal(journeyProgress(-500, 2000), .25);
  assert.equal(journeyProgress(-2400, 2000), 1);
  for (const distance of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) assert.equal(journeyProgress(-100, distance), 0);
  assert.equal(journeyProgress(Number.NaN, 2000), 0);
});

test("assembly finishes before release and the completed signature follows the settled drop", () => {
  for (let step = 0; step <= 400; step++) {
    const state = journeyMotion(step / 400);
    if (state.dropRelease > 0) {
      assert.deepEqual(state.papers, [1, 1, 1]);
      assert.equal(state.boardOpacity, 0);
    }
    if (state.signatureReveal === 1) assert.equal(state.dropProgress, 1);
    if (state.papers[1] > 0) assert.equal(state.papers[0], 1);
    if (state.papers[2] > 0) assert.equal(state.papers[1], 1);
  }
  assert.equal(journeyMotion(.43).pipetteOpacity, 1);
  assert.equal(journeyMotion(.43).dropRelease, 0);
  assert.equal(journeyMotion(.92).dropProgress, 1);
  assert.equal(journeyMotion(.82).signatureReveal, 0);
  assert.equal(journeyMotion(.94).dropOpacity, 1);
});

test("copy has exclusive visibility and each of the five scenes gets a readable interval", () => {
  const reachedFull = new Set<number>();
  for (let step = 0; step <= 2000; step++) {
    const state = journeyMotion(step / 2000);
    assert.ok(state.scenes.filter(opacity => opacity > 0).length <= 1);
    state.scenes.forEach((opacity, scene) => {
      if (opacity === 1) reachedFull.add(scene);
      if (opacity > 0) assert.equal(state.activeScene, scene);
    });
  }
  assert.equal(reachedFull.size, 5);
  assert.equal(journeyMotion(0).scenes[0], 1);
  assert.equal(journeyMotion(1).scenes[4], 1);
});

test("the completed board stays readable before its reversible melt into glass", () => {
  const prepared = journeyMotion(.30);
  assert.deepEqual(prepared.papers, [1, 1, 1]);
  assert.equal(prepared.boardOpacity, 1);
  assert.equal(prepared.boardMelt, 0);
  assert.equal(prepared.boardLiquid, 0);
  assert.equal(prepared.pipetteOpacity, 0);
  let previousMelt = 1;
  for (let step = 430; step >= 310; step--) {
    const state = journeyMotion(step / 1000);
    assert.deepEqual(state.papers, [1, 1, 1]);
    assert.ok(state.boardMelt <= previousMelt);
    assert.equal(state.dropRelease, 0);
    previousMelt = state.boardMelt;
  }
  const glass = journeyMotion(.43);
  assert.equal(glass.boardMelt, 1);
  assert.equal(glass.boardOpacity, 0);
  assert.equal(glass.pipetteOpacity, 1);
  assert.equal(glass.dropProgress, 0);
  assert.equal(journeyMotion(.92).dropMorph, 1);
});

test("material values stay finite and bounded across overscroll, with a settled final mark", () => {
  let previousDrop = 0;
  for (let step = -100; step <= 1100; step++) {
    const state = journeyMotion(step / 1000);
    for (const [key, value] of Object.entries(state)) {
      if (key === "activeScene" || key === "scenes" || key === "papers") continue;
      assert.ok(typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1, key);
    }
    assert.ok(state.dropProgress >= previousDrop);
    previousDrop = state.dropProgress;
  }
  assert.equal(journeyMotion(Number.NaN).scenes[0], 1);
  const final = journeyMotion(Number.POSITIVE_INFINITY);
  assert.equal(final.signatureReveal, 1);
  assert.equal(final.dropOpacity, 0);
  assert.equal(final.boardOpacity, 0);
  assert.equal(final.pipetteOpacity, 0);
});
