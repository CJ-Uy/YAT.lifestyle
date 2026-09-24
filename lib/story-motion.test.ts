import assert from "node:assert/strict";
import test from "node:test";
import { storyMotion } from "./story-motion.ts";

test("the drop falls before resolving into the YAT logo", () => {
  const start = storyMotion(96, 2000, 800, 96, 5);
  const middle = storyMotion(96 - 1296 * 0.38, 2000, 800, 96, 5);
  const end = storyMotion(-1200, 2000, 800, 96, 5);
  assert.deepEqual(start, { progress: 0, logoReveal: 0, time: 0 });
  assert.equal(middle.logoReveal, 0);
  assert.ok(middle.time > 0 && middle.time < 3.1);
  assert.deepEqual(end, { progress: 1, logoReveal: 1, time: 3.1 });
});
