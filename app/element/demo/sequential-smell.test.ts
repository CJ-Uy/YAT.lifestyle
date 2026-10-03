import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceSequence, BASE_PAUSE_SECONDS, canAdvanceSequence, gapSeconds, INTENSITY_PAUSE_SECONDS, normaliseSequence, previousInSequence, skipDemoGap } from "./sequential-smell.ts";

test("intensity requires a response, then five elapsed seconds before the next vial", () => {
  const first = { index: 0 };
  assert.equal(advanceSequence(first, [false, false, false, false], INTENSITY_PAUSE_SECONDS, 1000), first);
  const gap = advanceSequence(first, [true, false, false, false], INTENSITY_PAUSE_SECONDS, 1000);
  assert.deepEqual(gap, { index: 1, deadline: 6000 });
  assert.equal(gapSeconds(gap, 5999), 1);
  assert.equal(canAdvanceSequence(gap, [true, true, false, false], 5999), false);
  assert.equal(canAdvanceSequence(gap, [true, true, false, false], 6000), true);
});

test("six bases have five independent fifteen-second gaps and no final pause", () => {
  const answered = Array<boolean>(6).fill(false);
  let sequence: { index: number; deadline?: number } = { index: 0 };
  let now = 10_000;
  for (let i = 0; i < 6; i++) {
    answered[i] = true;
    sequence = advanceSequence(sequence, answered, BASE_PAUSE_SECONDS, now);
    assert.equal(sequence.index, i + 1);
    if (i < 5) {
      assert.equal(gapSeconds(sequence, now), 15);
      now += 15_000;
      assert.equal(gapSeconds(sequence, now), 0);
    } else assert.equal(sequence.deadline, undefined);
  }
});

test("a reload preserves the deadline and wall-clock elapsed time", () => {
  const reloaded = normaliseSequence(JSON.parse(JSON.stringify({ index: 2, deadline: 20_000 })), 6);
  assert.equal(gapSeconds(reloaded, 17_100), 3);
  assert.equal(gapSeconds(reloaded, 80_000), 0);
  assert.deepEqual(normaliseSequence({ index: 100, deadline: NaN }, 6), { index: 5 });
});

test("back retains answers but a fresh forward departure starts a fresh gap", () => {
  const back = previousInSequence({ index: 2, deadline: 9000 });
  assert.deepEqual(back, { index: 1 });
  assert.deepEqual(advanceSequence(back, [true, true, true, false], 5, 7000), { index: 2, deadline: 12_000 });
});

test("only explicitly skipped sample gaps can bypass the timer", () => {
  const gap = { index: 1, deadline: 16_000 };
  assert.equal(skipDemoGap(gap, "kit", 1000), gap);
  assert.equal(canAdvanceSequence(skipDemoGap(gap, "kit", 1000), [true, true], 1000), false);
  assert.equal(canAdvanceSequence(skipDemoGap(gap, "sample", 1000), [true, true], 1000), true);
});
