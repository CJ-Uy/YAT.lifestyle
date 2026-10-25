"use client";

import { useEffect, useRef, useState } from "react";

export function StyledQr({ value, size = 216, color = "#223541" }: { value: string; size?: number; color?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const container = host.current;
    setFailed(false);
    // The renderer accesses the DOM, so keep it outside server rendering.
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      if (cancelled || !container) return;
      container.replaceChildren();
      new QRCodeStyling({
        // Four quiet-zone modules even for the smallest (21-module) QR matrix.
        width: size, height: size, type: "svg", data: value, margin: Math.ceil(size * 4 / 29),
        dotsOptions: { type: "square", color },
        cornersSquareOptions: { type: "square", color },
        cornersDotOptions: { type: "square", color },
        qrOptions: { errorCorrectionLevel: "H" },
        backgroundOptions: { color: "transparent" },
      }).append(container);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; container?.replaceChildren(); };
  }, [value, size, color]);
  return <div className="styled-qr" style={{ width: size, minHeight: size, background: "transparent" }}>
    <div ref={host} role="img" aria-label={value} />
    {failed && <a href={value}>{value}</a>}
  </div>;
}
