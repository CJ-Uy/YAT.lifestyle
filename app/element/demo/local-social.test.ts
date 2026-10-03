import assert from "node:assert/strict";
import { test } from "node:test";
import { CARD_FAMILIES, confirmedProfileId, familyValues, parseMemories, signatureBars } from "./local-social.ts";

const likes = { citrus: 3, green: 5, water: 2, floral: 4, woody: 1, amber: 3 };
const memory = {
  id: "saved-1", person: "Mei", note: "Tea after the rain.", base: "tea",
  likes, collection: "people", createdAt: "2026-10-04T10:00:00.000Z", example: true,
};

test("scent memories round-trip their profile, collection and example provenance", () => {
  assert.deepEqual(parseMemories(JSON.stringify([memory])), [memory]);
  assert.equal(parseMemories(JSON.stringify([{ ...memory, example: "true" }]))[0].example, false);
});

test("invalid or old browser storage cannot become a saved scent profile", () => {
  assert.deepEqual(parseMemories("{broken"), []);
  assert.deepEqual(parseMemories('{"not":"a list"}'), []);
  const invalid = [
    null, { ...memory, id: "not an id" }, { ...memory, base: "other" }, { ...memory, collection: "unknown" },
    { ...memory, person: " " }, { ...memory, note: "x".repeat(501) },
    { ...memory, createdAt: "not-a-date" }, { ...memory, likes: { ...likes, green: 6 } },
    { ...memory, likes: { ...likes, amber: null } },
  ];
  assert.deepEqual(parseMemories(JSON.stringify(invalid)), []);
  assert.equal(parseMemories(JSON.stringify([memory, memory])).length, 1);
});

test("every family changes its own part of the visual signature", () => {
  const baseline = signatureBars(likes);
  for (const family of CARD_FAMILIES) {
    const next = signatureBars({ ...likes, [family]: likes[family] === 5 ? 4 : likes[family] + 1 });
    assert.notDeepEqual(next.filter(bar => bar.family === family), baseline.filter(bar => bar.family === family));
    assert.deepEqual(next.filter(bar => bar.family !== family), baseline.filter(bar => bar.family !== family));
  }
  assert.deepEqual(familyValues({ citrus: NaN, green: 7, amber: -1 }), { citrus: 3, green: 5, water: 3, floral: 3, woody: 3, amber: 1 });
});

test("only a server-style profile identifier can become a public link", () => {
  assert.equal(confirmedProfileId("founder"), true);
  assert.equal(confirmedProfileId("abc123-456"), true);
  for (const bad of [null, "", "../private", "https://elsewhere.test", "a?shared=1", "UPPER", "x".repeat(41)]) {
    assert.equal(confirmedProfileId(bad), false);
  }
});
