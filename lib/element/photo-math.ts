// Pure lid-photo maths, mirrored from scripts/photo_reader.py (same steps and thresholds).
// Images are RGBA byte arrays (canvas ImageData shape); colours are RGB 0-255.

export type Pt = { x: number; y: number };
export type RGB = [number, number, number];
export type Img = { width: number; height: number; data: Uint8ClampedArray<ArrayBuffer> };
type Rect = { x: number; y: number; w: number; h: number };
type Zone = {
  y0: number; y1: number;
  markers: Record<string, Pt>;
  neutrals: Record<string, Rect>;
  slots: Record<string, Partial<Rect> & { sheet?: Rect; pads?: Rect[] }>;
  blue_scale?: Rect[];
  chart?: { ph: string; y: number; pads: { x: number; w: number; h: number }[] }[];
};
export type LidLayout = { board_mm: number[]; marker_mm: number; zones: { blot: Zone; ph: Zone } };
export type BlotReading = { oil: number; step: 1 | 2 | 3 | 4 | 5 | 6; clearArea: number };
export type PhReading = { skin: number; control: number; diff: number; confidence: number };
export type WarpedReading =
  | { ok: true; corrected: Img; flags: string[]; blot?: BlotReading; ph?: PhReading }
  | { ok: false; reason: "blur" | "glare" };

export const PX_PER_MM = 10;
const DRY_BORDER_MM = 3;
const BLUR_VARIANCE = 20;
const MIN_NEUTRAL_SPAN = 25;
const SHADOW_LUMA = 25;
const GLARE_SHARE = 0.02;
const clip01 = (v: number) => Math.max(0, Math.min(1, v));

// ---------- geometry ----------

/** Solve A x = b by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error("Degenerate homography points");
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array<number>(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/** Homography (h33 = 1) mapping each src point to its dst point; exact for 4 points, least squares for more. */
export function homography(src: Pt[], dst: Pt[]): number[] {
  const A: number[][] = [], b: number[] = [];
  src.forEach(({ x, y }, i) => {
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  });
  if (A.length === 8) return [...solve(A, b), 1];
  const AtA = Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => A.reduce((s, r) => s + r[i] * r[j], 0)));
  const Atb = Array.from({ length: 8 }, (_, i) => A.reduce((s, r, k) => s + r[i] * b[k], 0));
  return [...solve(AtA, Atb), 1];
}

export function project(H: number[], { x, y }: Pt): Pt {
  const w = H[6] * x + H[7] * y + H[8];
  return { x: (H[0] * x + H[1] * y + H[2]) / w, y: (H[3] * x + H[4] * y + H[5]) / w };
}

/** Bilinear warp: output pixel (x, y) samples src at H(x, y); outside pixels are black (OpenCV BORDER_CONSTANT). */
export function warp(src: Img, H: number[], width: number, height: number): Img {
  const out = new Uint8ClampedArray(width * height * 4), { data, width: sw, height: sh } = src;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const w = H[6] * x + H[7] * y + H[8];
      const sx = (H[0] * x + H[1] * y + H[2]) / w, sy = (H[3] * x + H[4] * y + H[5]) / w;
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0, o = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        let v = 0;
        for (const [dx, dy, wt] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
          const px = x0 + dx, py = y0 + dy;
          if (wt && px >= 0 && py >= 0 && px < sw && py < sh) v += wt * data[(py * sw + px) * 4 + c];
        }
        out[o + c] = Math.round(v);
      }
      out[o + 3] = 255;
    }
  }
  return { width, height, data: out };
}

// ---------- colour ----------

export const luma = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** sRGB (0-255) to CIELAB D65, matching OpenCV COLOR_RGB2Lab on float input. */
export function srgbToLab(rgb: RGB): RGB {
  const [r, g, b] = rgb.map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const X = (0.412453 * r + 0.35758 * g + 0.180423 * b) / 0.950456;
  const Y = 0.212671 * r + 0.71516 * g + 0.072169 * b;
  const Z = (0.019334 * r + 0.119193 * g + 0.950227 * b) / 1.088754;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

/** CIE76 colour difference. */
export const deltaE = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// ---------- statistics ----------

/** numpy.percentile with linear interpolation (q in 0..1). Sorts a copy. */
export function quantile(values: ArrayLike<number>, q: number): number {
  const s = Float64Array.from(values).sort(), i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

const median = (px: RGB[]): RGB => [0, 1, 2].map(c => quantile(px.map(p => p[c]), 0.5)) as RGB;

// Python round() (half to even) so patch bounds match the prototype pixel for pixel.
const pyRound = (v: number) => { const f = Math.floor(v), d = v - f; return d > 0.5 || (d === 0.5 && f % 2 !== 0) ? f + 1 : f; };

function bounds(rect: Rect, y0: number, inset: number) {
  return [rect.x + inset, rect.y - y0 + inset, rect.x + rect.w - inset, rect.y - y0 + rect.h - inset].map(v => pyRound(v * PX_PER_MM));
}

function patch(img: Img, rect: Rect, y0: number, inset = 0.5): RGB[] {
  const [x0, top, x1, bottom] = bounds(rect, y0, inset), out: RGB[] = [];
  if (x0 < 0 || top < 0 || x1 > img.width || bottom > img.height || x1 <= x0 || bottom <= top) {
    throw new Error("Layout rectangle falls outside the warped zone");
  }
  for (let y = top; y < bottom; y++) {
    for (let x = x0; x < x1; x++) { const i = (y * img.width + x) * 4; out.push([img.data[i], img.data[i + 1], img.data[i + 2]]); }
  }
  return out;
}

/** Variance of the 4-neighbour Laplacian of the grey patch (cv2.Laplacian ksize=1, BORDER_REFLECT_101). */
function laplacianVariance(img: Img, rect: Rect, y0: number): number {
  const [x0, top, x1, bottom] = bounds(rect, y0, 0), w = x1 - x0, h = bottom - top;
  const grey = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((top + y) * img.width + x0 + x) * 4, d = img.data;
    grey[y * w + x] = (d[i] * 4899 + d[i + 1] * 9617 + d[i + 2] * 1868 + 8192) >> 14; // OpenCV RGB2GRAY fixed point
  }
  const at = (x: number, y: number) => grey[(y < 0 ? 1 : y >= h ? h - 2 : y) * w + (x < 0 ? 1 : x >= w ? w - 2 : x)];
  let sum = 0, sq = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1) - 4 * at(x, y);
    sum += v; sq += v * v;
  }
  return sq / (w * h) - (sum / (w * h)) ** 2;
}

// ---------- readings ----------

/**
 * Oil from a colour-corrected sheet crop: each pixel's darkening from the dry border median,
 * scaled so 1 = blue_scale[5] (clear over black). Step = scale swatch nearest the 90th-percentile pixel.
 */
export function blotScore(sheet: Img, scale: RGB[], borderPx = DRY_BORDER_MM * PX_PER_MM): BlotReading {
  const { width: w, height: h, data } = sheet, dry: RGB[] = [], lumas = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, px: RGB = [data[i], data[i + 1], data[i + 2]];
    lumas[y * w + x] = luma(px);
    if (x < borderPx || x >= w - borderPx || y < borderPx || y >= h - borderPx) dry.push(px);
  }
  const dryLuma = luma(median(dry)), scaleLuma = scale.map(luma), span = Math.max(dryLuma - scaleLuma[5], 1);
  const oil = lumas.map(l => clip01((dryLuma - l) / span));
  const wetLuma = dryLuma - quantile(oil, 0.9) * span;
  let step = 0;
  scaleLuma.forEach((l, i) => { if (Math.abs(l - wetLuma) < Math.abs(scaleLuma[step] - wetLuma)) step = i; });
  return {
    oil: oil.reduce((s, v) => s + v, 0) / oil.length,
    step: (step + 1) as BlotReading["step"],
    clearArea: oil.filter(v => v > 0.7).length / oil.length,
  };
}

const phNumber = (label: string) => {
  const m = label.match(/[0-9]+(?:\.[0-9]+)?/);
  if (!m) throw new Error(`Invalid pH chart label: ${label}`);
  return Number(m[0]);
};

/**
 * pH of one strip: summed deltaE of its pads against every chart row; the two closest rows are
 * blended inversely to their distance. Confidence = 1 - best/second.
 */
export function phMatch(rows: { ph: string; lab: RGB[] }[], padsLab: RGB[]): { value: number; confidence: number } {
  const scores = rows.map((row, index) => ({ index, d: row.lab.reduce((s, ref, k) => s + deltaE(ref, padsLab[k]), 0) }))
    .sort((a, b) => a.d - b.d || a.index - b.index);
  const [best, second] = scores, total = best.d + second.d;
  const pb = phNumber(rows[best.index].ph), ps = phNumber(rows[second.index].ph);
  return {
    value: total > 1e-6 ? (pb * second.d + ps * best.d) / total : pb,
    confidence: second.d > 1e-6 ? clip01(1 - best.d / second.d) : 0,
  };
}

function crop(img: Img, rect: Rect, y0: number): Img {
  const [x0, top, x1, bottom] = bounds(rect, y0, 0), w = x1 - x0, h = bottom - top, out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) out.set(img.data.subarray(((top + y) * img.width + x0) * 4, ((top + y) * img.width + x1) * 4), y * w * 4);
  return { width: w, height: h, data: out };
}

/** Lid-mm corner points of the zone's four markers (outer corner of each), in marker order. */
export function zoneCorners(zone: "blot" | "ph", layout: LidLayout): { id: number; corner: number; mm: Pt }[] {
  const z = layout.zones[zone], s = layout.marker_mm, ids = zone === "blot" ? [0, 1, 2, 3] : [4, 5, 6, 7];
  return ids.map((id, corner) => {
    const p = z.markers[String(id)];
    return { id, corner, mm: { x: p.x + (corner === 1 || corner === 2 ? s : 0), y: p.y + (corner >= 2 ? s : 0) } };
  });
}

/** Everything after the warp: blur gate, neutral normalisation, quality flags, zone reading. */
export function readWarped(warped: Img, zone: "blot" | "ph", layout: LidLayout): WarpedReading {
  const z = layout.zones[zone], size = layout.marker_mm, ids = zone === "blot" ? [0, 1, 2, 3] : [4, 5, 6, 7];
  const sharp = ids.map(id => laplacianVariance(warped, { ...z.markers[String(id)], w: size, h: size }, z.y0));
  if (quantile(sharp, 0.5) < BLUR_VARIANCE) return { ok: false, reason: "blur" };
  const named = (suffix: string) => Object.entries(z.neutrals).filter(([n]) => n.endsWith(suffix)).map(([, r]) => patch(warped, r, z.y0));
  const whites = named("white"), white = median(whites.flat()), black = median(named("black").flat());
  if (white.some((v, c) => v - black[c] < MIN_NEUTRAL_SPAN)) return { ok: false, reason: "glare" };
  const flags: string[] = [];
  if (whites.some(p => p.filter(px => px.some(v => v === 255)).length / p.length > GLARE_SHARE)) flags.push("glare");
  for (const n of ["white", "grey", "black"]) {
    const l = z.neutrals[`left_${n}`], r = z.neutrals[`right_${n}`];
    if (l && r && Math.abs(luma(median(patch(warped, l, z.y0))) - luma(median(patch(warped, r, z.y0)))) > SHADOW_LUMA) {
      flags.push("shadow");
      break;
    }
  }
  const data = new Uint8ClampedArray(warped.data.length);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) data[i + c] = Math.floor(clip01((warped.data[i + c] - black[c]) / (white[c] - black[c])) * 255);
    data[i + 3] = 255;
  }
  const corrected: Img = { width: warped.width, height: warped.height, data };
  if (zone === "blot") {
    const scale = (z.blue_scale ?? []).map(r => median(patch(corrected, r, z.y0)));
    return { ok: true, corrected, flags, blot: blotScore(crop(corrected, z.slots.blot.sheet!, z.y0), scale) };
  }
  const rows = (z.chart ?? []).map(row => ({ ph: row.ph, lab: row.pads.map(p => srgbToLab(median(patch(corrected, { ...p, y: row.y }, z.y0)))) }));
  const strip = (slot: string) => phMatch(rows, z.slots[slot].pads!.map(p => srgbToLab(median(patch(corrected, p, z.y0)))));
  const skin = strip("ph_skin"), control = strip("ph_control");
  return { ok: true, corrected, flags, ph: { skin: skin.value, control: control.value, diff: skin.value - control.value, confidence: Math.min(skin.confidence, control.confidence) } };
}
