import assert from "node:assert/strict";
import test from "node:test";
import { STORY_FRAMES, dropTipGeometry, storyMotion } from "./story-motion.ts";

test("tip repair is confined to detached necks and rejoins the untouched body", () => {
  for (let frame = 0; frame < STORY_FRAMES; frame++) {
    const tip = dropTipGeometry(frame);
    if (frame < 36 || frame > 39) { assert.equal(tip, null); continue; }
    assert.ok(tip);
    assert.ok(tip.y > 500 && tip.y + tip.widths.length < 735);
    assert.ok(tip.widths[0] < 4, "The cap must converge to a narrow tip");
    assert.equal(tip.widths.at(-1), tip.width, "No seam at the unmodified body");
    assert.ok(tip.widths.every((width, row) => Number.isFinite(width) && width > 0 && width <= tip.width && (!row || width >= tip.widths[row - 1])));
  }
});

test("the drop falls before resolving into the YAT logo", () => {
  const start = storyMotion(0, 4800, 800, 520);
  const middle = storyMotion(-2000, 4800, 800, 520);
  const end = storyMotion(-4000, 4800, 800, 520);
  assert.equal(start.frame, 0);
  assert.equal(start.idleLightOpacity, 1);
  const lightHandoff = storyMotion(-6, 4800, 800, 520);
  assert.ok(lightHandoff.idleLightOpacity > 0 && lightHandoff.idleLightOpacity < 1);
  assert.equal(lightHandoff.frame, 0);
  assert.equal(storyMotion(-12, 4800, 800, 520).idleLightOpacity, 0);
  assert.equal(start.logoReveal, 0);
  assert.equal(middle.logoReveal, 0);
  assert.ok(middle.frame > start.frame && middle.frame < end.frame);
  assert.ok(middle.dropY > start.dropY);
  assert.equal(end.frame, STORY_FRAMES - 1);
  assert.equal(end.logoReveal, 1);
  assert.equal(end.focusY, end.landingY);
  const handoff = storyMotion(-3480, 4800, 800, 520);
  assert.equal(handoff.filmOpacity, 0);
  assert.equal(handoff.vectorOpacity, 1);
  assert.equal(handoff.dropMorph, 0);
  assert.equal(handoff.settle, 0);
  assert.ok(handoff.logoReveal < 1e-10);
  assert.ok(storyMotion(0, 6 * 568, 568, 370).focusY < 180);
  assert.ok(storyMotion(-3440, 4800, 800, 520).scenes.every((scene) => scene.opacity < 1e-10));
  for (let step = 0; step <= 100; step++) {
    const motion = storyMotion(-step * 40, 4800, 800, 520);
    assert.ok(Math.abs(motion.filmOpacity + motion.vectorOpacity - 1) < 1e-10);
    assert.ok(Number.isFinite(motion.focusY));
    assert.ok(motion.idleLightOpacity >= 0 && motion.idleLightOpacity <= 1);
    if (motion.frame > 0) assert.equal(motion.idleLightOpacity, 0);
    assert.ok(motion.zoom >= 1 && motion.zoom <= 1.04, "Avoid enlarging the filmed drop beyond the restrained zoom range");
    assert.ok(motion.scenes.every((scene) => scene.opacity >= 0 && scene.opacity <= 1));
  }
  for (const [index, progress] of [0, .22, .4, .58, .75].entries()) {
    assert.equal(storyMotion(-progress * 4000, 4800, 800, 520).scenes[index].opacity, 1);
  }
  assert.equal(storyMotion(-5000, 4800, 800, 520).signatureReveal, 1);
  assert.equal(storyMotion(100, 4800, 800, 520).progress, 0);
});
