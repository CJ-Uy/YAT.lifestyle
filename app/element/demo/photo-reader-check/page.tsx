"use client";

// Dev-only check: runs the browser reader on the real dark photo and the synthetic board fixture.
// Python reference values come from scripts/test_photo_reader.py (same files).
import { useEffect, useState } from "react";
import { detectMarkers, readZone, type LidLayout } from "../photo-reader";

const CASES = ["blot-dark.webp", "synthetic-board-test.png"];

export default function PhotoReaderCheck() {
  const [output, setOutput] = useState("running");
  const dev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!dev) return;
    (async () => {
      const lines: string[] = [];
      try {
        const layout: LidLayout = await (await fetch("/kit/lid-board.json")).json();
        for (const name of CASES) {
          const res = await fetch(`/kit/test-photos/${name}`);
          if (!res.ok) throw new Error(`missing /kit/test-photos/${name}`);
          const image = await createImageBitmap(await res.blob());
          const t = performance.now();
          const ids = [...(await detectMarkers(image)).keys()].sort((a, b) => a - b);
          lines.push(`${name}: markers ${ids.join(",")}`);
          for (const zone of ["blot", "ph"] as const) {
            const r = await readZone(image, zone, layout);
            lines.push(`${name} ${zone}: ${JSON.stringify(r.ok ? { flags: r.flags, ...(r.blot && { blot: r.blot }), ...(r.ph && { ph: r.ph }) } : r)}`);
          }
          lines.push(`${name}: ${Math.round(performance.now() - t)} ms`);
          image.close();
        }
        lines.push("done");
      } catch (error) {
        lines.push(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
      }
      console.log(lines.join("\n"));
      setOutput(lines.join("\n"));
    })();
  }, [dev]);

  if (!dev) return null;
  return (
    <main style={{ padding: 24 }}>
      <h1>Lid photo reader check</h1>
      <pre id="result" style={{ whiteSpace: "pre-wrap" }}>{output}</pre>
    </main>
  );
}
