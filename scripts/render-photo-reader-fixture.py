"""Render the real SVG with headless Chrome at exactly 10 pixels per mm."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHROME = Path("C:/Program Files/Google/Chrome/Application/chrome.exe")


def render():
    work = ROOT / ".tmp" / "photo-reader-render"
    work.mkdir(parents=True, exist_ok=True)
    html = work / "board.html"
    svg = (ROOT / "public/kit/lid-board.svg").read_text(encoding="utf-8")
    html.write_text('<style>html,body{margin:0}svg{display:block;width:1600px;height:1300px}</style>' + svg, encoding="utf-8")
    output = ROOT / "public/kit/rendered-board-test.png"
    args = [str(CHROME), "--headless", "--disable-gpu", "--no-sandbox", "--disable-crash-reporter",
            f"--user-data-dir={work / 'chrome-profile'}", "--hide-scrollbars",
            "--force-device-scale-factor=1", "--window-size=1600,1300",
            f"--screenshot={output}", html.as_uri()]
    result = subprocess.run(args, capture_output=True, text=True, timeout=60)
    if result.returncode or not output.exists():
        raise RuntimeError(result.stderr)
    print("rendered public/kit/rendered-board-test.png at 1600 x 1300 (10 px/mm)")


if __name__ == "__main__":
    render()
