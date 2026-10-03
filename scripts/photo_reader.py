"""Read one Element lid zone. Input images use OpenCV's BGR channel order."""
import json
import re
from pathlib import Path

import cv2
import numpy as np

LAYOUT = json.loads((Path(__file__).resolve().parent.parent / "public/kit/lid-board.json").read_text(encoding="utf-8"))
PX_PER_MM = 10
DRY_BORDER_MM = 3
BLUR_VARIANCE = 20
MIN_NEUTRAL_SPAN = 25


def detect_markers(img):
    """Return {id: four corners}, in decoded TL/TR/BR/BL order, for any layout."""
    dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    parameters = cv2.aruco.DetectorParameters()
    parameters.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
    corners, ids, _ = cv2.aruco.ArucoDetector(dictionary, parameters).detectMarkers(img)
    return {} if ids is None else {int(mid): points.reshape(4, 2) for mid, points in zip(ids.flatten(), corners)}


def _bounds(rect, y0, inset=0):
    return tuple(round(v * PX_PER_MM) for v in (
        rect["x"] + inset, rect["y"] - y0 + inset,
        rect["x"] + rect["w"] - inset, rect["y"] - y0 + rect["h"] - inset))


def _patch(image, rect, y0, inset=0.5):
    x0, top, x1, bottom = _bounds(rect, y0, inset)
    patch = image[top:bottom, x0:x1]
    if not patch.size:
        raise ValueError("Layout rectangle falls outside the warped zone")
    return patch


def _median(patch):
    return np.median(patch.reshape(-1, 3), axis=0)


def _luma(colour):
    return np.asarray(colour) @ np.array([0.0722, 0.7152, 0.2126])


def _lab(colour):
    return cv2.cvtColor(np.float32(colour).reshape(1, 1, 3) / 255, cv2.COLOR_BGR2Lab)[0, 0]


def _ph_value(label):
    return float(re.search(r"[0-9]+(?:\.[0-9]+)?", str(label)).group())


def read_zone(img, zone, layout=LAYOUT):
    """Warp a zone at 10 px/mm, normalize references, and return relative readings."""
    z = layout["zones"][zone]
    required = list(range(4)) if zone == "blot" else list(range(4, 8))
    markers = detect_markers(img)
    missing = [mid for mid in required if mid not in markers]
    if missing:
        return {"ok": False, "reason": "markers", "missing": missing}
    source, target = [], []
    size = layout["marker_mm"]
    # One outer corner from each marker spans the entire zone, avoiding an
    # ill-conditioned transform based on the corners of one tiny marker.
    for corner, mid in enumerate(required):
        pos = z["markers"][str(mid)]
        source.append(markers[mid][corner])
        target.append([(pos["x"] + (size if corner in (1, 2) else 0)) * PX_PER_MM,
                       (pos["y"] - z["y0"] + (size if corner in (2, 3) else 0)) * PX_PER_MM])
    transform = cv2.getPerspectiveTransform(np.float32(source), np.float32(target))
    warped = cv2.warpPerspective(img, transform,
                                (round(layout["board_mm"][0] * PX_PER_MM), round((z["y1"] - z["y0"]) * PX_PER_MM)))
    sharpness = []
    for mid in required:
        rect = {**z["markers"][str(mid)], "w": size, "h": size}
        grey = cv2.cvtColor(_patch(warped, rect, z["y0"], 0), cv2.COLOR_BGR2GRAY)
        sharpness.append(cv2.Laplacian(grey, cv2.CV_64F, ksize=1).var())
    if np.median(sharpness) < BLUR_VARIANCE:
        return {"ok": False, "reason": "blur"}
    whites = [_patch(warped, p, z["y0"]) for n, p in z["neutrals"].items() if n.endswith("white")]
    blacks = [_patch(warped, p, z["y0"]) for n, p in z["neutrals"].items() if n.endswith("black")]
    white = _median(np.concatenate([p.reshape(-1, 3) for p in whites]))
    black = _median(np.concatenate([p.reshape(-1, 3) for p in blacks]))
    if np.any(white - black < MIN_NEUTRAL_SPAN):
        return {"ok": False, "reason": "glare"}
    flags = []
    if any(np.mean(np.any(p == 255, axis=2)) > 0.02 for p in whites):
        flags.append("glare")
    for neutral in ("white", "grey", "black"):
        left, right = z["neutrals"].get(f"left_{neutral}"), z["neutrals"].get(f"right_{neutral}")
        if left and right and abs(_luma(_median(_patch(warped, left, z["y0"]))) - _luma(_median(_patch(warped, right, z["y0"])))) > 25:
            flags.append("shadow")
            break
    corrected = np.clip((warped.astype(np.float32) - black) / (white - black) * 255, 0, 255).astype(np.uint8)
    result = {"ok": True, "warped": corrected, "flags": flags}
    if zone == "blot":
        sheet = _patch(corrected, z["slots"]["blot"]["sheet"], z["y0"], 0)
        border = DRY_BORDER_MM * PX_PER_MM
        mask = np.ones(sheet.shape[:2], dtype=bool)
        mask[border:-border, border:-border] = False
        dry_luma = float(_luma(_median(sheet[mask])))
        scale = [_median(_patch(corrected, p, z["y0"])) for p in z["blue_scale"]]
        clear_luma = float(_luma(scale[5]))
        oil_pixels = np.clip((dry_luma - _luma(sheet)) / max(dry_luma - clear_luma, 1), 0, 1)
        # The 90th percentile in oil intensity represents the darker/wetter tail.
        wet_luma = dry_luma - np.percentile(oil_pixels, 90) * max(dry_luma - clear_luma, 1)
        step = int(np.argmin(np.abs(_luma(scale) - wet_luma))) + 1
        result["blot"] = {"oil": float(oil_pixels.mean()), "step": step, "clearArea": float(np.mean(oil_pixels > 0.7))}
    else:
        references = [[_lab(_median(_patch(corrected, {**p, "y": row["y"]}, z["y0"]))) for p in row["pads"]] for row in z["chart"]]
        readings, confidence = {}, []
        for slot in ("skin", "control"):
            pads = [_lab(_median(_patch(corrected, p, z["y0"]))) for p in z["slots"][f"ph_{slot}"]["pads"]]
            scores = np.linalg.norm(np.array(references) - np.array(pads), axis=2).sum(axis=1)
            best, second = np.argsort(scores, kind="stable")[:2]
            total = scores[best] + scores[second]
            readings[slot] = float((_ph_value(z["chart"][best]["ph"]) * scores[second] + _ph_value(z["chart"][second]["ph"]) * scores[best]) / total) if total > 1e-6 else _ph_value(z["chart"][best]["ph"])
            confidence.append(float(np.clip(1 - scores[best] / scores[second], 0, 1)) if scores[second] > 1e-6 else 0)
        result["ph"] = {**readings, "diff": readings["skin"] - readings["control"], "confidence": min(confidence)}
    return result
