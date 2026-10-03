import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { blotScore, deltaE, dryBorderLuma, homography, phMatch, project, sheetMissing, srgbToLab, type Img, type RGB } from "./photo-math.ts";

const layout = JSON.parse(readFileSync(new URL("../../public/kit/lid-board.json", import.meta.url), "utf8"));
const hex = (h: string): RGB => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as RGB;

test("homography maps a known square onto its perspective quad (4 points exact, 16 points least squares)", () => {
  const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  const quad = [{ x: 80, y: 110 }, { x: 1580, y: 40 }, { x: 1690, y: 1330 }, { x: 30, y: 1410 }];
  const H = homography(square, quad);
  square.forEach((p, i) => {
    const q = project(H, p);
    assert.ok(Math.hypot(q.x - quad[i].x, q.y - quad[i].y) < 1e-6, JSON.stringify({ p, q }));
  });
  const grid = Array.from({ length: 16 }, (_, i) => ({ x: (i % 4) * 33, y: Math.floor(i / 4) * 33 }));
  const H16 = homography(grid, grid.map(p => project(H, p)));
  const mid = project(H, { x: 50, y: 50 }), mid16 = project(H16, { x: 50, y: 50 });
  assert.ok(Math.hypot(mid.x - mid16.x, mid.y - mid16.y) < 1e-4);
});

test("Lab and deltaE: white/black reference values, identical colours give zero", () => {
  const white = srgbToLab([255, 255, 255]), black = srgbToLab([0, 0, 0]);
  assert.ok(Math.abs(white[0] - 100) < 0.01 && Math.abs(white[1]) < 0.01 && Math.abs(white[2]) < 0.01, String(white));
  assert.ok(Math.abs(deltaE(white, black) - 100) < 0.01);
  assert.equal(deltaE(srgbToLab([35, 168, 255]), srgbToLab([35, 168, 255])), 0);
  const red = srgbToLab([255, 0, 0]); // OpenCV: L 53.24, a 80.09, b 67.20
  assert.ok(Math.abs(red[0] - 53.24) < 0.1 && Math.abs(red[1] - 80.09) < 0.2 && Math.abs(red[2] - 67.2) < 0.2, String(red));
});

function sheet(inner: RGB): Img {
  const w = 800, h = 500, data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inside = x >= 150 && x < 500 && y >= 100 && y < 350, c = inside ? inner : hex("#23a8ff"), i = (y * w + x) * 4;
    data.set([...c, 255], i);
  }
  return { width: w, height: h, data };
}

test("blot score rises monotonically as the oily patch darkens; dry sheet scores zero", () => {
  const scale = layout.zones.blot.blue_scale.map((s: { printed_hex: string }) => hex(s.printed_hex));
  const dry = blotScore(sheet(hex("#23a8ff")), scale);
  assert.equal(dry.oil, 0);
  assert.equal(dry.step, 1);
  let last = dry.oil;
  for (const s of scale.slice(1)) {
    const r = blotScore(sheet(s), scale);
    assert.ok(r.oil > last, `${r.oil} > ${last}`);
    last = r.oil;
  }
  const full = blotScore(sheet(scale[5]), scale);
  assert.ok(Math.abs(full.clearArea - (350 * 250) / (800 * 500)) < 1e-9);
  assert.equal(full.step, 6);
});

test("an empty black box is refused as no sheet; dry and oily sheets are not", () => {
  const scale = layout.zones.blot.blue_scale.map((s: { printed_hex: string }) => hex(s.printed_hex));
  const black = hex("#000000"), blackLuma = 12; // a printed black patch after correction sits just above 0
  const empty: Img = { width: 400, height: 300, data: new Uint8ClampedArray(400 * 300 * 4).map((_, i) => (i % 4 === 3 ? 255 : 18)) };
  assert.ok(sheetMissing(dryBorderLuma(empty), blackLuma, scale), "black box, no sheet");
  assert.ok(!sheetMissing(dryBorderLuma(sheet(hex("#23a8ff"))), blackLuma, scale), "dry sheet");
  assert.ok(!sheetMissing(dryBorderLuma(sheet(scale[5])), blackLuma, scale), "oily centre, dry border");
  assert.ok(!sheetMissing(dryBorderLuma(sheet(black)), blackLuma, scale));
});

test("pH match picks the painted chart rows and blends toward the second nearest", () => {
  const rows = layout.zones.ph.chart.map((r: { ph: string; pads: { printed_hex: string }[] }) => ({ ph: r.ph, lab: r.pads.map(p => srgbToLab(hex(p.printed_hex))) }));
  const exact = phMatch(rows, rows[2].lab);
  assert.equal(exact.value, Number(rows[2].ph.match(/[0-9.]+/)[0]));
  assert.equal(exact.confidence, 1);
  assert.ok(Math.abs(phMatch(rows, rows[7].lab).value - 8) <= 0.5);
  const between = rows[4].lab.map((a: RGB, k: number) => a.map((v, c) => (v + rows[5].lab[k][c]) / 2) as RGB);
  const mixed = phMatch(rows, between);
  const [p4, p5] = [rows[4].ph, rows[5].ph].map((s: string) => Number(s.match(/[0-9.]+/)![0]));
  assert.ok(mixed.value > Math.min(p4, p5) && mixed.value < Math.max(p4, p5), JSON.stringify(mixed));
  assert.ok(mixed.confidence < 0.5);
});
