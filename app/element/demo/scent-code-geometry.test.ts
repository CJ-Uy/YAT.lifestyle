import assert from "node:assert/strict";
import { test } from "node:test";
import { CARD_FAMILIES, type FamilyValues } from "./local-social.ts";
import { SCENT_CODE_QR, SCENT_CODE_VIEWBOX, scentCodeContour } from "./scent-code-geometry.ts";

test("scent contours preserve the entire square QR and its quiet zone for extreme profiles", () => {
  const inset = (SCENT_CODE_VIEWBOX - SCENT_CODE_QR) / 2;
  const far = inset + SCENT_CODE_QR;
  for (let mask = 0; mask < 64; mask++) {
    const likes = Object.fromEntries(CARD_FAMILIES.map((family, index) => [family, mask & (1 << index) ? 5 : 1])) as FamilyValues;
    for (const offset of [0, 6]) {
      const contour = scentCodeContour(likes, offset);
      for (const curve of contour.curves) {
        for (let step = 0; step <= 40; step++) {
          const t = step / 40, u = 1 - t;
          const x = u ** 3 * curve.from.x + 3 * u ** 2 * t * curve.p1.x + 3 * u * t ** 2 * curve.p2.x + t ** 3 * curve.to.x;
          const y = u ** 3 * curve.from.y + 3 * u ** 2 * t * curve.p1.y + 3 * u * t ** 2 * curve.p2.y + t ** 3 * curve.to.y;
          assert.ok(x >= 1 && y >= 1 && x <= SCENT_CODE_VIEWBOX - 1 && y <= SCENT_CODE_VIEWBOX - 1, "outline stays inside its canvas");
          assert.ok(x < inset - 2 || x > far + 2 || y < inset - 2 || y > far + 2, "outline never enters the protected QR square");
        }
      }
    }
  }
});

test("a scent signature is deterministic and changes with every preference family", () => {
  const likes = Object.fromEntries(CARD_FAMILIES.map(family => [family, 3])) as FamilyValues;
  const original = scentCodeContour(likes).path;
  assert.equal(scentCodeContour({ ...likes }).path, original);
  for (const family of CARD_FAMILIES) assert.notEqual(scentCodeContour({ ...likes, [family]: 4 }).path, original);
});
