"""Generate the Element demo-kit lid board and its layout JSON.

The board is 160 x 130 mm so it fits inside a 17 x 14 cm box lid. It has two zones,
each photographed on its own as the test happens, so each zone has its own four corner
markers and its own white/grey/black references:

  BLOT zone (markers 0-3): one 80 x 50 mm blue blotting sheet over a black box, plus a
      blue scale. Forehead, forearm and the evaporation drop, one photo each.
  pH zone (markers 4-7): CONTROL and SKIN strip slots for Macherey-Nagel pH-Fix 4.5-10.0
      strips (3 pads at the tip: yellow, tan, red), laid pads-left so they read in chart order, plus a printed copy of that tube's colour chart.

Outputs (mm from the board's top-left corner):
  public/kit/lid-board.svg   the board on its own
  public/kit/lid-board.json  zones, slots and reference colours for the photo reader
  public/kit/lid-board.pdf   A4 sheet with the board centred, cut marks and a 100 mm check

Run: python scripts/make-lid-board.py
Needs: opencv-contrib-python-headless and Chrome or Edge for the PDF. Assets in scripts/kit-assets.
"""
import base64
import json
import subprocess
from pathlib import Path

import cv2

W, H = 160, 130
MK = 10  # ArUco DICT_4X4_50 marker side
INK, PAPER, GOLD, MUTED = "#080806", "#ffffff", "#b8862d", "#666666"
DEMO_URL = "https://yatlifestyle.com/element/demo"
NEUTRALS = [("white", "#ffffff"), ("grey", "#777777"), ("black", "#000000")]
# Dry blue paper to fully see-through over the black box, sampled from a real photo
# (white-balanced against the board's own patches, 3 Oct). Relative reference only; the
# reader also uses the sheet's own dry border.
BLUE_SCALE = ['#23a8ff', '#1e8ddd', '#1971bb', '#14569a', '#0f3a78', '#0a1f56']
# MN pH-Fix 4.5-10.0, pads 1-3, eyeballed from photos of the tube label in warm indoor
# light. Approximate: calibrate against the real label before relying on exact readings.
# pH 7.0 was hidden under a sticker in the photos, so it is interpolated.
PH_CHART = [
    ("≤4.5", "#f0c319", "#e1a028", "#f5b41e"),
    ("5.0", "#f0c81e", "#d7aa46", "#f5aa1e"),
    ("5.5", "#f0c81e", "#c8a55a", "#f08228"),
    ("6.0", "#f0c81e", "#b9a064", "#f0692d"),
    ("6.5", "#f0c814", "#aa9b6e", "#eb462d"),
    ("7.0", "#f0b91e", "#827d6e", "#e13737"),
    ("7.5", "#f0aa1e", "#5f5f5f", "#d7283c"),
    ("8.0", "#f08c1e", "#5f6e78", "#e1284b"),
    ("8.5", "#e65a28", "#557387", "#e62855"),
    ("9.0", "#e13728", "#507891", "#e62855"),
    ("9.5", "#be1e3c", "#507d96", "#e6285a"),
    ("≥10.0", "#c82350", "#5a879b", "#e62d50"),
]

layout = {"board_mm": [W, H], "demo_url": DEMO_URL, "aruco_dictionary": "DICT_4X4_50",
          "marker_mm": MK, "zones": {}}
svg = []


def rect(x, y, w, h, fill="none", stroke=None, sw=0.3, dash=None):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    d = f' stroke-dasharray="{dash}"' if dash else ""
    svg.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill}"{s}{d}/>')


def text(x, y, s, size=2.4, anchor="start", weight="normal", fill=INK):
    svg.append(f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}" '
               f'fill="{fill}" font-family="Trebuchet MS, Arial, sans-serif">{s}</text>')


ASSETS = Path(__file__).resolve().parent / "kit-assets"


def image(name, x, y, w, h, max_px=700):
    """Embed a PNG from scripts/kit-assets, downscaled to about 600 dpi at its print size."""
    img = cv2.imread(str(ASSETS / name))
    scale = min(1, max_px / max(img.shape[:2]))
    img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    data = base64.b64encode(cv2.imencode(".png", img)[1].tobytes()).decode()
    svg.append(f'<image x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" '
               f'preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,{data}"/>')


def cells(grid, x, y, size):
    """Draw a 0/1 grid (1 = black), slightly overlapped so no hairlines show."""
    cell = size / len(grid)
    for r, row in enumerate(grid):
        for c, black in enumerate(row):
            if black:
                rect(x + c * cell, y + r * cell, cell + 0.12, cell + 0.12, INK)


def zone(name, ids, y0, y1):
    """Four markers at the zone's corners: TL, TR, BR, BL."""
    aruco = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    spots = [(2, y0), (W - 2 - MK, y0), (W - 2 - MK, y1 - MK), (2, y1 - MK)]
    z = layout["zones"][name] = {"y0": y0, "y1": y1, "markers": {}, "neutrals": {}, "slots": {}}
    for mid, (x, y) in zip(ids, spots):
        bits = cv2.aruco.generateImageMarker(aruco, mid, 6)
        cells([[v == 0 for v in row] for row in bits], x, y, MK)
        z["markers"][mid] = {"x": x, "y": y}
    return z


def neutrals(z, x, y, w=9, h=6, vertical=True):
    for i, (name, colour) in enumerate(NEUTRALS):
        px, py = (x, y + i * (h + 1)) if vertical else (x + i * (w + 1), y)
        rect(px, py, w, h, colour, INK, 0.2)
        z["neutrals"][name] = {"x": px, "y": py, "w": w, "h": h, "printed_hex": colour}


# ---- BLOT zone ----------------------------------------------------------------
# The 80 x 50 mm sheet sits on an 86 x 56 mm black box (3 mm spare on every side) that
# stays at least 4 mm clear of every corner marker, so a slightly crooked sheet never
# covers a marker. Blue scale and neutrals share the box's top edge; the QR its bottom.
blot = zone("blot", [0, 1, 2, 3], 2, 68)
text(146, 7, "1", 3, "end", weight="bold", fill=GOLD)
BOX = (16, 10, 86, 56)
rect(*BOX, INK)  # black: the clearer the paper, the darker it reads
rect(BOX[0] + 3, BOX[1] + 3, 80, 50, stroke="#555555", sw=0.25, dash="1 0.8")  # sheet guide
blot["slots"]["blot"] = {"x": BOX[0], "y": BOX[1], "w": BOX[2], "h": BOX[3], "background": "black",
                         "sheet": {"x": BOX[0] + 3, "y": BOX[1] + 3, "w": 80, "h": 50}}
blot["blue_scale"] = []
for i, colour in enumerate(BLUE_SCALE):
    y = 10 + i * 9.5
    rect(106, y, 7, 8.5, colour, INK, 0.2)
    blot["blue_scale"].append({"step": i + 1, "x": 106, "y": y, "w": 7, "h": 8.5, "printed_hex": colour})
# Right block (x 116-142, 6 mm clear of the right markers): neutrals along the box's top
# edge, then the Element logo, then the QR with "scan me to start" on the box's bottom line.
for i, (name, colour) in enumerate(NEUTRALS):
    x = 116 + i * 9
    rect(x, 10, 8, 8.5, colour, INK, 0.2)
    blot["neutrals"][name] = {"x": x, "y": 10, "w": 8, "h": 8.5, "printed_hex": colour}
# Brand QR (gold, rounded) for DEMO_URL. OpenCV cannot read rounded modules; ZXing and
# phone cameras can, so verify with zxing-cpp after changes.
image("element-logo.png", 120.34, 21.5, 17.32, 13)
image("element-qr.png", 117, 37, 24, 24)
text(129, 65.6, "SCAN ME TO START", 2.2, "middle", weight="bold", fill=GOLD)

# ---- pH zone --------------------------------------------------------------------
# Centred stack: CONTROL strip, chart, SKIN strip. Neutrals flank the chart on both
# sides (mirrored), so every photo has white, grey and black near every pad.
svg.append(f'<line x1="2" y1="69.5" x2="{W - 2}" y2="69.5" stroke="{GOLD}" stroke-width="0.3" stroke-dasharray="1.5 1"/>')
ph = zone("ph", [4, 5, 6, 7], 71, 128)
text(146, 76, "2", 3, "end", weight="bold", fill=GOLD)
CX = W / 2
STRIP_W, STRIP_H = 95, 8  # real strip ~6 x 85 mm, +1 cm long, +2 mm wide
PAD_OFFSETS = [1.5, 9.5, 17.5]  # real strip: 1.5 mm from the tip, 6 mm pads, 2 mm gaps
TIP_W, TIP_GAP, ROW_H, ROW_PITCH = 22, 4, 5.5, 8.5
chart_w = 4 * TIP_W + 3 * TIP_GAP
stack_h = STRIP_H + 5 + (2 * ROW_PITCH + ROW_H) + 5 + STRIP_H
top = 99.5 - stack_h / 2
chart_x, chart_y = CX - chart_w / 2, top + STRIP_H + 5

# Skin on top, control (water only) on the bottom; both photographed together, still wet.
for name, y in [("SKIN", top), ("CONTROL", chart_y + 2 * ROW_PITCH + ROW_H + 5)]:
    x = CX - STRIP_W / 2
    rect(x, y, STRIP_W, STRIP_H, PAPER, INK, 0.35)
    text(x + STRIP_W - 2, y + STRIP_H / 2 + 0.8, name, 2.2, "end", weight="bold", fill="#b0b0b0")
    for off in PAD_OFFSETS:
        rect(x + 1 + off, y + 1, 6, 6, stroke="#9a9a9a", sw=0.25, dash="0.8 0.6")
    ph["slots"][f"ph_{name.lower()}"] = {"x": x, "y": y, "w": STRIP_W, "h": STRIP_H,
                                          "pads": [{"x": x + 1 + o, "y": y + 1, "w": 6, "h": 6} for o in PAD_OFFSETS]}

# The tube's chart, unlabelled: one mini strip tip per pH value, pads in the same order
# as the real strip, ascending pH left to right then top to bottom. Values live only in
# the JSON.
ph["chart"] = []
for i, (label, *pads) in enumerate(PH_CHART):
    x, y = chart_x + (i % 4) * (TIP_W + TIP_GAP), chart_y + (i // 4) * ROW_PITCH
    for off, colour in zip([0, 8, 16], pads):
        rect(x + off, y, 6, ROW_H, colour)
    ph["chart"].append({"ph": label, "y": y, "pads": [
        {"x": x + off, "w": 6, "h": ROW_H, "printed_hex": c} for off, c in zip([0, 8, 16], pads)]})

for side, x, order in [("left", chart_x - 14, NEUTRALS), ("right", chart_x + chart_w + 4, NEUTRALS[::-1])]:
    for i, (name, colour) in enumerate(order):
        y = chart_y + i * ROW_PITCH
        rect(x, y, 10, ROW_H, colour, INK, 0.2)
        ph["neutrals"][f"{side}_{name}"] = {"x": x, "y": y, "w": 10, "h": ROW_H, "printed_hex": colour}

board = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">'
         f'<rect width="{W}" height="{H}" fill="{PAPER}"/>' + "".join(svg) + "</svg>")

out = Path(__file__).resolve().parent.parent / "public" / "kit"
out.mkdir(parents=True, exist_ok=True)
(out / "lid-board.svg").write_text(board, encoding="utf-8")
(out / "lid-board.json").write_text(json.dumps(layout, indent=2, ensure_ascii=False), encoding="utf-8")

# A4 print sheet: board centred with cut marks and a 100 mm check line.
ox, oy = (210 - W) / 2, 40
marks = "".join(
    f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#000" stroke-width="0.2"/>'
    for (px, py) in [(ox, oy), (ox + W, oy), (ox + W, oy + H), (ox, oy + H)]
    for (x1, y1, x2, y2) in [(px - 6 if px == ox else px + 1, py, px - 1 if px == ox else px + 6, py),
                             (px, py - 6 if py == oy else py + 1, px, py - 1 if py == oy else py + 6)]
)
sheet = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 0 }} html, body {{ margin: 0 }}
</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">
<text x="105" y="20" font-size="4" text-anchor="middle" font-family="Arial">Element lab lid. Print at 100% / actual size. Cut on the corner marks (160 x 130 mm).</text>
<line x1="55" y1="28" x2="155" y2="28" stroke="#000" stroke-width="0.4"/>
<line x1="55" y1="25" x2="55" y2="31" stroke="#000" stroke-width="0.3"/><line x1="155" y1="25" x2="155" y2="31" stroke="#000" stroke-width="0.3"/>
<text x="105" y="34" font-size="3" text-anchor="middle" font-family="Arial">This line must measure exactly 100 mm.</text>
<g transform="translate({ox},{oy})"><rect width="{W}" height="{H}" fill="{PAPER}"/>{"".join(svg)}</g>
<rect x="{ox}" y="{oy}" width="{W}" height="{H}" fill="none" stroke="#888" stroke-width="0.25" stroke-dasharray="2 1.2"/>
<text x="{ox}" y="{oy - 2}" font-size="3" font-family="Arial" fill="#888">✂ cut along the dashed line</text>
{marks}
</svg></body></html>"""
html = out / "lid-board-print.html"
html.write_text(sheet, encoding="utf-8")
for browser in [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"]:
    if Path(browser).exists():
        subprocess.run([browser, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                        f"--print-to-pdf={out / 'lid-board.pdf'}", html.as_uri()], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        break
html.unlink()
print("wrote", out / "lid-board.svg", out / "lid-board.json", out / "lid-board.pdf")
