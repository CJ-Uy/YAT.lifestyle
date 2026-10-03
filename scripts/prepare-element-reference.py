"""Render the supplied board without redrawing its measurement artwork."""
import hashlib
import json
from pathlib import Path
import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\charl\Downloads\FINAL BOARD.pdf")
OUT = ROOT / "public" / "media"
document = pymupdf.open(SOURCE)
# The 160 x 130 mm board, excluding the surrounding print instructions.
clip = pymupdf.Rect(70.75, 113.5, 524.3, 481.9)
pixmap = document[0].get_pixmap(matrix=pymupdf.Matrix(3.4, 3.4), clip=clip, alpha=False)
image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
image.save(OUT / "element-final-board.webp", lossless=True, method=6)
(OUT / "element-final-board.json").write_text(json.dumps({
    "source": "User-supplied FINAL BOARD.pdf",
    "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    "page": 1, "clip_points": list(clip),
    "method": "Direct PDF rendering; original markers, QR and colour patches preserved.",
    "size": image.size,
}, indent=2) + "\n", encoding="utf-8")
print(f"Rendered original board: {image.width} x {image.height}")
