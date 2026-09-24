import assert from "node:assert/strict";
import test from "node:test";
import { STORY_FRAMES, storyMotion } from "./story-motion.ts";

test("the drop falls before resolving into the YAT logo", () => {
  const start = storyMotion(0, 4800, 800, 390);
  const middle = storyMotion(-2000, 4800, 800, 390);
  const end = storyMotion(-4000, 4800, 800, 390);
  assert.equal(start.frame, 0);
  assert.equal(start.logoReveal, 0);
  assert.equal(middle.logoReveal, 0);
  assert.ok(middle.frame > start.frame && middle.frame < end.frame);
  assert.ok(middle.dropY > start.dropY);
  assert.equal(end.frame, STORY_FRAMES - 1);
  assert.equal(end.logoReveal, 1);
  assert.equal(end.focusY, end.landingY);
  assert.ok(storyMotion(0, 6 * 568, 568, 320).focusY < 180);
  assert.ok(storyMotion(-3360, 4800, 800, 390).narrationOpacity < 1e-10);
});
