import { CARD_FAMILIES, familyValues, type FamilyValues } from "./local-social.ts";

export type ScentPoint = { x: number; y: number };
export const SCENT_CODE_VIEWBOX = 440;
export const SCENT_CODE_QR = 240;

/** Six real preferences define a closed, flowing contour outside the complete QR quiet zone. */
export function scentCodeContour(values: FamilyValues, offset = 0) {
  const likes = familyValues(values);
  const center = SCENT_CODE_VIEWBOX / 2;
  const points = CARD_FAMILIES.map((family, index) => {
    const angle = index * Math.PI / 3 - Math.PI / 2;
    const radius = 180 + likes[family] * 6 + offset;
    return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
  });
  const curves = points.map((from, index) => {
    const before = points[(index + 5) % 6];
    const to = points[(index + 1) % 6];
    const after = points[(index + 2) % 6];
    return { from, to,
      p1: { x: from.x + (to.x - before.x) / 6, y: from.y + (to.y - before.y) / 6 },
      p2: { x: to.x - (after.x - from.x) / 6, y: to.y - (after.y - from.y) / 6 },
    };
  });
  const xy = (p: ScentPoint) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
  const path = `M${xy(points[0])}${curves.map(curve => `C${xy(curve.p1)} ${xy(curve.p2)} ${xy(curve.to)}`).join("")}Z`;
  return { points, curves, path };
}
