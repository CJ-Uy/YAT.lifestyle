"""Plain-assert regression tests; run with python scripts/test_photo_reader.py."""
from pathlib import Path

import cv2
import numpy as np

from photo_reader import LAYOUT, detect_markers, read_zone

HERE = Path(__file__).parent / "kit-assets" / "test-photos"
RENDERED = Path(__file__).parent.parent / "public" / "kit" / "rendered-board-test.png"


def test_markers_on_real_photos():
    for name in ["blot-old-layout.webp", "daylight-old-layout.webp", "blot-dark.webp"]:
        image = cv2.imread(str(HERE / name))
        assert image is not None, name
        ids = detect_markers(image)
        print(f"{name}: markers {sorted(ids)}")
        assert {4, 5, 6, 7} <= set(ids), (name, ids)
        if name != "blot-dark.webp":
            assert not {0, 3} & set(ids), (name, ids)
            result = read_zone(image, "blot", LAYOUT)
            assert result == {"ok": False, "reason": "markers", "missing": [0, 3]}, result


def test_v12_lid_photos():
    """The current printed lid: a clean sheet, an oily sheet, and the empty black box."""
    for name in ["v12-clean-blot.webp", "v12-oily-blot.webp", "v12-no-blot.webp"]:
        image = cv2.imread(str(HERE / name))
        assert image is not None, name
        assert set(range(8)) <= set(detect_markers(image)), name
        blot, ph = read_zone(image, "blot", LAYOUT), read_zone(image, "ph", LAYOUT)
        print(f"{name}: blot {blot.get('blot', blot.get('reason'))}; ph {ph.get('ph', ph.get('reason'))}")
        if name == "v12-no-blot.webp":
            assert blot == {"ok": False, "reason": "no-sheet"}, blot
        else:
            assert blot["ok"] and blot["blot"]["oil"] < 0.2, blot
    clean = read_zone(cv2.imread(str(HERE / "v12-clean-blot.webp")), "blot", LAYOUT)["blot"]
    oily = read_zone(cv2.imread(str(HERE / "v12-oily-blot.webp")), "blot", LAYOUT)["blot"]
    assert oily["oil"] > clean["oil"], (clean, oily)


def paint(image, rect, colour):
    x, y, w, h = [round(rect[k] * 10) for k in ("x", "y", "w", "h")]
    rgb = tuple(int(colour[i:i + 2], 16) for i in (1, 3, 5))
    image[y:y + h, x:x + w] = rgb[::-1]


def synthetic_board():
    board = cv2.imread(str(RENDERED))
    assert board is not None, f"Render lid-board.svg at 10 px/mm to {RENDERED} first"
    assert board.shape[:2] == (1300, 1600), board.shape
    sheet = LAYOUT["zones"]["blot"]["slots"]["blot"]["sheet"]
    paint(board, sheet, "#23a8ff")
    paint(board, {"x": sheet["x"] + 15, "y": sheet["y"] + 10, "w": 35, "h": 25}, "#0a1f56")
    ph = LAYOUT["zones"]["ph"]
    for slot, row in [("ph_skin", ph["chart"][2]), ("ph_control", ph["chart"][7])]:
        for pad, reference in zip(ph["slots"][slot]["pads"], row["pads"]):
            paint(board, pad, reference["printed_hex"])
    return board


def test_readings_on_rendered_board():
    board = synthetic_board()
    cv2.imwrite(str(RENDERED.with_name("synthetic-board-test.png")), board)
    assert set(range(8)) <= set(detect_markers(board))
    for label, image in [("flat", board), ("perspective", perspective(board))]:
        blot = read_zone(image, "blot", LAYOUT)
        ph = read_zone(image, "ph", LAYOUT)
        assert blot["ok"], blot
        assert 0 < blot["blot"]["oil"] <= 1, blot["blot"]
        assert blot["blot"]["step"] in range(1, 7), blot["blot"]
        assert 0 < blot["blot"]["clearArea"] < 1, blot["blot"]
        assert ph["ok"], ph
        assert abs(ph["ph"]["skin"] - 5.5) <= 0.5, ph["ph"]
        assert abs(ph["ph"]["control"] - 8.0) <= 0.5, ph["ph"]
        assert abs(ph["ph"]["diff"] - (ph["ph"]["skin"] - ph["ph"]["control"])) < 1e-9
        assert 0 <= ph["ph"]["confidence"] <= 1
        assert "glare" in ph["flags"]  # Fully white rendered patches are saturated.
        print(f"{label}: blot {blot['blot']}; ph {ph['ph']}; flags {ph['flags']}")


def perspective(board):
    source = np.float32([[0, 0], [1599, 0], [1599, 1299], [0, 1299]])
    target = np.float32([[80, 110], [1580, 40], [1690, 1330], [30, 1410]])
    return cv2.warpPerspective(board, cv2.getPerspectiveTransform(source, target), (1750, 1470), borderValue=(255, 255, 255))


def test_missing_and_quality():
    blank = np.full((1300, 1600, 3), 255, np.uint8)
    assert read_zone(blank, "ph", LAYOUT) == {"ok": False, "reason": "markers", "missing": [4, 5, 6, 7]}
    board = synthetic_board()
    ph = LAYOUT["zones"]["ph"]
    paint(board, ph["neutrals"]["right_grey"], "#bbbbbb")
    assert "shadow" in read_zone(board, "ph", LAYOUT)["flags"]
    for name, patch in ph["neutrals"].items():
        if name.endswith("black"):
            paint(board, patch, "#ffffff")
    assert read_zone(board, "ph", LAYOUT) == {"ok": False, "reason": "glare"}
    dry = synthetic_board()
    paint(dry, LAYOUT["zones"]["blot"]["slots"]["blot"]["sheet"], "#23a8ff")
    assert read_zone(dry, "blot", LAYOUT)["blot"]["oil"] < 0.02
    blurry = np.clip(cv2.GaussianBlur(synthetic_board(), (0, 0), 4).astype(np.float32) * 0.4 + 30, 0, 255).astype(np.uint8)
    assert {4, 5, 6, 7} <= set(detect_markers(blurry))
    assert read_zone(blurry, "ph", LAYOUT) == {"ok": False, "reason": "blur"}
    print("quality: missing markers, shadow, glare rejection, dry sheet, blur rejection - PASS")


if __name__ == "__main__":
    test_markers_on_real_photos()
    test_v12_lid_photos()
    test_readings_on_rendered_board()
    test_missing_and_quality()
    print("ok")
