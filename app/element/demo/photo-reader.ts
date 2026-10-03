/// <reference types="vite/client" />
// Browser lid reader: js-aruco2 finds the markers, lib/element/photo-math does the rest.
import cvUrl from "js-aruco2/src/cv.js?url";
import arucoUrl from "js-aruco2/src/aruco.js?url";
import dictUrl from "js-aruco2/src/dictionaries/aruco_4x4_1000.js?url";
import { PX_PER_MM, homography, readWarped, warp, zoneCorners, type BlotReading, type LidLayout, type PhReading, type Pt } from "../../../lib/element/photo-math.ts";

export type { LidLayout };
export type ZoneResult =
  | { ok: true; warped: HTMLCanvasElement; flags: string[]; blot?: BlotReading; ph?: PhReading }
  | { ok: false; reason: "markers" | "blur" | "glare" | "no-sheet"; missing?: number[] };
type ReaderImage = HTMLCanvasElement | ImageBitmap | HTMLImageElement;
type Detector = { detect(image: { width: number; height: number; data: Uint8ClampedArray }): { id: number; corners: Pt[] }[] };
type ArucoGlobal = { Detector: new (config: { dictionaryName: string; maxHammingDistance?: number }) => Detector };

let ready: Promise<Detector> | undefined;

// js-aruco2 is a set of classic scripts that attach CV and AR to the global object, so load them as <script> tags in order.
function script(src: string) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => { el.remove(); reject(new Error(`Could not load ${src}`)); };
    document.head.appendChild(el);
  });
}

function detector(): Promise<Detector> {
  ready ??= (async () => {
    for (const src of [cvUrl, arucoUrl, dictUrl]) await script(src);
    const AR = (window as unknown as { AR?: ArucoGlobal }).AR;
    if (!AR) throw new Error("js-aruco2 did not expose window.AR");
    // ARUCO_4X4_1000 IDs 0-49 equal OpenCV DICT_4X4_50; exact codes only.
    return new AR.Detector({ dictionaryName: "ARUCO_4X4_1000", maxHammingDistance: 0 });
  })().catch(error => { ready = undefined; throw error; });
  return ready;
}

/** Load the marker detector once. */
export async function loadReader(): Promise<void> {
  await detector();
}
/** Back-compat name for the demo UI. */
export const loadOpenCv = loadReader;

function pixels(image: ReaderImage, scale = 1): ImageData {
  const w = Math.round(image.width * scale), h = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(image, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/** Marker id -> 4 corners (TL, TR, BR, BL in the marker's own frame), image pixels. */
export async function detectMarkers(image: ReaderImage, full = pixels(image)): Promise<Map<number, Pt[]>> {
  const det = await detector(), found = new Map<number, Pt[]>();
  // js-aruco2 thresholds with a fixed small window; smaller copies widen it on big, unevenly lit photos.
  for (const scale of [1, 0.75, 0.5]) {
    const data = scale === 1 ? full : pixels(image, scale), k = full.width / data.width;
    for (const m of det.detect(data)) {
      if (m.id <= 7 && !found.has(m.id)) found.set(m.id, m.corners.map(p => ({ x: p.x * k, y: p.y * k })));
    }
    if (found.size === 8) break;
  }
  return found;
}

/** Find the zone's markers, warp the zone to 10 px/mm, and read it. */
export async function readZone(image: ReaderImage, zone: "blot" | "ph", layout: LidLayout): Promise<ZoneResult> {
  const full = pixels(image), markers = await detectMarkers(image, full);
  const corners = zoneCorners(zone, layout);
  const missing = corners.filter(c => !markers.has(c.id)).map(c => c.id);
  if (missing.length) return { ok: false, reason: "markers", missing };
  const z = layout.zones[zone];
  // Lid px (mm * 10, relative to the zone top) -> image px, from each marker's outer corner.
  const H = homography(corners.map(c => ({ x: c.mm.x * PX_PER_MM, y: (c.mm.y - z.y0) * PX_PER_MM })), corners.map(c => markers.get(c.id)![c.corner]));
  const warpedImg = warp(full, H, Math.round(layout.board_mm[0] * PX_PER_MM), Math.round((z.y1 - z.y0) * PX_PER_MM));
  const r = readWarped(warpedImg, zone, layout);
  if (!r.ok) return r;
  const warped = document.createElement("canvas");
  warped.width = r.corrected.width;
  warped.height = r.corrected.height;
  warped.getContext("2d")!.putImageData(new ImageData(r.corrected.data, r.corrected.width, r.corrected.height), 0, 0);
  const { corrected: _, ...rest } = r;
  return { ...rest, warped };
}
